/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import {
  JOB_QUEUE,
  JOB_QUEUE_CHILD,
  JOB_STATUS,
  SOURCE_SCRATCH,
  THUMBNAIL_DEFAULT,
  WEBSITE,
} from 'src/constants';
import { Job, Queue } from 'bull';
import { BusinessService } from 'src/modules/business/business.service';
import {
  connectPage,
  formatPhoneNumber,
  parseUSAddress,
  promisesSequentially,
} from 'src/helper';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import { JobService } from '../../job.service';
import { JobEntity } from 'src/entities/job.entity';
import { BullJob } from 'src/interface';
import { UserEntity } from 'src/entities';
import { CreateJobSearchBusinessDto } from '../../dto';
import { InjectQueue } from '@nestjs/bull';

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
export class SearchYellowService {
  constructor(
    private jobService: JobService,
    private businessService: BusinessService,
    @InjectQueue(JOB_QUEUE)
    private scrapingQueue: Queue,
  ) {}

  async reJobSearch(id: string, currentUser: UserEntity) {
    try {
      const job = await this.scrapingQueue.add(
        JOB_QUEUE_CHILD.SEARCH_YELLOW,
        { jobId: id, userId: currentUser?.id },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 20,
        },
      );

      return job;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

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
      const result = await this.jobService.create({ ...values, statusData });

      await this.scrapingQueue.add(
        JOB_QUEUE_CHILD.SEARCH_YELLOW,
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
            return this.searchWhithZipCode(job, newPayload);
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

  async searchWhithZipCode(
    job: JobEntity,
    payload: PayloadSearchBusiness,
  ): Promise<any> {
    const { id, statusData } = job;
    const { keyword, zipCode } = payload;
    let page = payload?.page;
    try {
      while (true) {
        const url = `${WEBSITE.YELLOW_PAGES.URL}/search?search_terms=${keyword}&geo_location_terms=${zipCode}&page=${page}`;
        const response = await connectPage(url);
        if (!response) return;
        const body = await response?.text();
        const $ = cheerio.load(body);
        const businessList = await this.findElDetail($);
        if (businessList?.length === 0) break;
        for (const business of businessList) {
          const newBusiness = {
            ...business,
            keyword,
            source: SOURCE_SCRATCH.YELLOW_PAGES,
            scratchLink: WEBSITE.YELLOW_PAGES.URL + business.scratchLink,
            phone: formatPhoneNumber(business.phone),
          };
          await this.businessService.saveScratchBusiness(newBusiness, false);
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

  async findElDetail($: any) {
    const businessListForPage = [];
    $('[class="search-results organic"] .result')?.map(
      (i: number, el: Element) => {
        const addressStreet = $(el)
          ?.find('.info-secondary .adr .street-address')
          ?.text();
        const addressLocality = $(el)
          ?.find('.info-secondary .adr .locality')
          ?.text();
        const name = $(el)?.find('.info-primary h2 .business-name')?.text();
        const categories = $(el)
          ?.find('.info-primary .categories')
          ?.text()
          ?.split(', ');

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
          thumbnailUrl: !thumbnailUrl?.includes(THUMBNAIL_DEFAULT.YELLOW)
            ? thumbnailUrl
            : undefined,
          phone,
          zipCode,
          state,
          city,
          address,
        };
        if (!name || !phone || !state || !zipCode || !address) return;
        return businessListForPage.push(item);
      },
    );

    return businessListForPage;
  }
}
