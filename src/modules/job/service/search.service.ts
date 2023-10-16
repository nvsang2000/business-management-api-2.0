/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  DEFAULT_OPTION_HEADER_FETCH,
  JOB_STATUS,
  METHOD,
  WEBSITE,
} from 'src/constants';
import { Job, Queue } from 'bull';
import { BusinessService } from 'src/modules/business/business.service';
import {
  formatPhoneNumber,
  parseUSAddress,
  promisesSequentially,
  setDelay,
} from 'src/helper';
import { CreateScratchBusinessDto } from 'src/modules/business/dto';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import { JobService } from '../job.service';
import { JobEntity } from 'src/entities/job.entity';
import { BullJob } from 'src/interface';
import { UserEntity } from 'src/entities';
import { CreateJobSearchBusinessDto } from '../dto';
import { InjectQueue } from '@nestjs/bull';
import { PrismaService } from 'nestjs-prisma';

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
export class SearchService {
  constructor(
    private jobService: JobService,
    private businessService: BusinessService,
    private prisma: PrismaService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async createJobSearch(
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
      const statusData: any = values?.zipCode?.reduce((acc, item) => {
        acc[item] = { zipCode: item, isFinish: false, page: 1 };
        return acc;
      }, {});

      const userId = currentUser?.id;
      const result = await this.jobService.create(
        { ...values, statusData },
        userId,
      );

      const jobsWaiting = await this.prisma.job.findMany({
        where: { status: JOB_STATUS.WAITING },
      });

      if (jobsWaiting?.length === 1)
        await this.scrapingQueue.add(
          'search',
          { jobId: result?.id, userId },
          {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 0,
          },
        );

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async runJobSearch(bull: Job<BullJob>) {
    const { jobId, userId } = bull.data;
    try {
      const job: JobEntity = await this.jobService.findById(jobId);
      const { statusData, keyword, createdAt, id } = job;
      const promises = Object?.values(statusData)?.map(
        (data: StatusDataItem) => {
          return async () => {
            if (data?.isFinish) return;
            const newPayload = { ...data, keyword };
            return this.searchBusiness(job, newPayload, userId);
          };
        },
      );
      const result = await promisesSequentially(promises, 10);
      if (result) {
        const job: JobEntity = await this.jobService.findById(jobId);
        const statusUnFinish = Object?.values(job?.statusData)?.filter(
          (i: any) => !i?.isFinish,
        );
        if (statusUnFinish?.length > 0)
          throw new UnprocessableEntityException();
      }

      const duration = dayjs().diff(dayjs(createdAt));
      const values = { duration, status: JOB_STATUS.COMPLETE };
      return await this.jobService.update(id, values, userId);
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async searchBusiness(
    job: JobEntity,
    payload: PayloadSearchBusiness,
    userId: string,
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
            website: website?.length > 400 ? undefined : website,
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
          if (!name || !phone || !state || !zipCode || !address) return;
          return businessListForPage.push(item);
        });
        if (businessListForPage?.length === 0) break;

        for (const business of businessListForPage as CreateScratchBusinessDto[]) {
          business.scratchLink =
            WEBSITE.YELLOW_PAGES.URL + business.scratchLink;
          business.phone = formatPhoneNumber(business.phone);

          const checkScratch = await this.businessService.findByScratchLink(
            business?.scratchLink,
          );

          if (!checkScratch)
            await this.businessService.createScratchBusiness(business, userId);
          else if (checkScratch) {
            if (checkScratch?.googleVerify) continue;
            await this.businessService.updateScratchBusiness(
              checkScratch?.id,
              business,
              userId,
            );
          }
        }

        const nextPage = $(WEBSITE.YELLOW_PAGES.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;
        statusData[zipCode].page = page;
        await this.jobService.update(id, { statusData });
        console.log(statusData[zipCode]);
      }
    } catch (e) {
      statusData[zipCode].messageError = e?.message;
      return await this.jobService.update(id, { statusData });
    } finally {
      statusData[zipCode].page = page;
      statusData[zipCode].isFinish = true;
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
          method: METHOD.GET,
          headers: DEFAULT_OPTION_HEADER_FETCH,
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