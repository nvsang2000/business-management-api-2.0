/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { BUSINESS_STATUS, JOB_STATUS, WEBSITE } from 'src/constants';
import { Job, Queue } from 'bull';
import { BusinessService } from 'src/modules/business/business.service';
import {
  formatPhoneNumber,
  parseUSAddress,
  promisesSequentially,
  setDelay,
} from 'src/helper';
import { UpdateScratchBusinessDto } from 'src/modules/business/dto';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import { JobService } from '../job.service';
import { JobEntity } from 'src/entities/job.entity';
import { BullJob } from 'src/interface';
import { UserEntity } from 'src/entities';
import { InjectQueue } from '@nestjs/bull';
import { CreateJobSearchBusinessDto } from '../dto';

interface PayloadSearchBusiness {
  keyword: string;
  zipCode: string;
  page: number;
}
interface StatusDataItem {
  zipCode: string;
  isFinish: boolean;
  page: number;
  messageError?: any;
}
@Injectable()
export class SearchBusinessService {
  constructor(
    private jobService: JobService,
    private businessService: BusinessService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async createJob(
    createJob: CreateJobSearchBusinessDto,
    currentUser: UserEntity,
  ) {
    try {
      const values = {
        ...createJob,
        county:
          createJob?.county && [].concat(createJob?.county).flat(Infinity),
        zipCode: [].concat(createJob?.zipCode).flat(Infinity),
      };
      const statusData = values?.zipCode?.reduce((acc, item) => {
        acc[item] = { zipCode: item, isFinish: false, page: 1 };
        return acc;
      }, {});

      const result = await this.jobService.create(
        { ...values, statusData },
        currentUser,
      );
      await this.scrapingQueue.add(
        'search-business',
        { jobId: result?.id, currentUser },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 20,
          backoff: 1000,
        },
      );

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async runJob(bull: Job<BullJob>) {
    const { jobId, currentUser } = bull.data;
    try {
      const job = await this.jobService.findById(jobId);
      const { statusData, keyword, createdAt, id } = job;
      const promises = Object?.values(statusData)?.map(
        (data: StatusDataItem, index) => {
          return async () => {
            if (data?.isFinish) return;
            await setDelay(index * 1000);
            const newPayload = {
              keyword,
              zipCode: data?.zipCode,
              page: data?.page,
            };
            return this.searchBusiness(job, newPayload, currentUser);
          };
        },
      );
      await promisesSequentially(promises, 5);

      const duration = dayjs().diff(dayjs(createdAt));
      const values = { duration, status: JOB_STATUS.COMPLETE };
      return await this.jobService.update(id, values, currentUser);
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async searchBusiness(
    job: JobEntity,
    payload: PayloadSearchBusiness,
    currentUser: UserEntity,
  ): Promise<any> {
    const { id, statusData } = job;
    const { keyword, zipCode } = payload;
    let page = payload?.page;
    try {
      while (true) {
        const response = await this.connectPage(keyword, zipCode, page);
        const body = await response?.text();
        const $ = cheerio.load(body);
        const businessListForPage = [];
        $('[class="search-results organic"] .result')?.map((i, el) => {
          const addressStreet = $(el)
            ?.find('.info-secondary .adr .street-address')
            ?.text();
          const addressLocality = $(el)
            ?.find('.info-secondary .adr .locality')
            ?.text();
          const name = $(el)?.find('.info-primary h2 .business-name')?.text();
          const categories = [];
          $(el)
            ?.find('.info-primary .categories a')
            ?.map((i, el) => categories.push($(el)?.text()));
          const phone = $(el).find('.info-secondary .phone')?.text();
          const thumbnailUrl = $(el)
            ?.find('.media-thumbnail-wrapper img')
            ?.attr('src');
          const scratchLink = $(el)?.find('.info-primary h2 a')?.attr('href');
          const website = $(el)
            ?.find('.info-primary .links a[target="_blank"]')
            ?.attr('href');

          const { address, city, state, zipCode } = parseUSAddress(
            addressLocality,
            addressStreet,
          );
          const item = {
            website,
            scratchLink,
            name,
            categories,
            thumbnailUrl,
            phone,
            zipCode,
            state,
            city,
            address,
          };
          businessListForPage.push(item);
        });
        if (businessListForPage?.length === 0) break;

        for (const business of businessListForPage) {
          if (!business?.name || !business?.phone || !business?.address)
            continue;

          const newBusiness: UpdateScratchBusinessDto = {
            ...business,
            scratchLink: WEBSITE.YELLOW_PAGES.URL + business.scratchLink,
            phone: formatPhoneNumber(business.phone),
          };

          const checkScratch = await this.businessService.findByScratchLink(
            newBusiness?.scratchLink,
          );

          const checkAddress =
            await this.businessService.findByAddressStateZipCode(
              business?.address,
              business?.state,
              business?.zipCode,
            );

          if (!checkScratch && !checkAddress)
            await this.businessService.createScratchBusiness(
              newBusiness,
              currentUser,
            );
          else if (checkScratch) {
            if (checkAddress) {
              const status = checkScratch?.status;
              if (status?.includes(BUSINESS_STATUS.ADDRESS_VERIFY))
                delete newBusiness?.address;

              if (status?.includes(BUSINESS_STATUS.PHONE_VERIFY))
                delete newBusiness?.phone;

              if (status?.includes(BUSINESS_STATUS.NAME_VERIFY))
                delete newBusiness?.name;
            }
            await this.businessService.updateScratchBusiness(
              checkScratch?.id,
              newBusiness,
              currentUser,
            );
          }
        }

        const nextPage = $(WEBSITE.YELLOW_PAGES.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;
        statusData[zipCode].page = page;
        console.log(statusData[zipCode]);
        await this.jobService.update(id, { statusData });
      }
      statusData[zipCode].isFinish = true;
      return await this.jobService.update(id, { statusData });
    } catch (e) {
      console.log(e);
      statusData[zipCode].page = page;
      statusData[zipCode].messageError = e?.message;
      return await this.jobService.update(id, { statusData });
    }
  }

  async connectPage(keyword: string, zipCode: string, page: number) {
    let tryCount = 0;
    while (tryCount < 10) {
      try {
        tryCount > 0 && console.log('tryCount', tryCount);
        const url = `${WEBSITE.YELLOW_PAGES.URL}/search?search_terms=${keyword}&geo_location_terms=${zipCode}&page=${page}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
          },
        });
        if (response.ok) return response;
        tryCount++;
      } catch {
        tryCount++;
        await setDelay(2000);
        continue;
      }
    }
  }
}
