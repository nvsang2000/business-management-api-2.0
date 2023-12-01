/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JobService } from '../../job.service';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { JobAutoDto } from '../../dto';
import {
  JOB_QUEUE,
  JOB_QUEUE_CHILD,
  JOB_STATUS,
  SOURCE_SCRATCH,
  TYPE_JOB,
  WEBSITE,
} from 'src/constants';
import { BullJob } from 'src/interface';
import { JobEntity } from 'src/entities/job.entity';
import {
  connectPage,
  formatPhoneNumber,
  promisesSequentially,
} from 'src/helper';
import dayjs from 'dayjs';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import * as cheerio from 'cheerio';
import { SearchYellowService } from './search.service';
import { BusinessService } from 'src/modules/business/business.service';

interface StatusDataItem {
  state: string;
  isFinish: boolean;
  page: number;
  messageError?: any;
}

@Injectable()
export class AutoSearchYellowService {
  constructor(
    private searchYellow: SearchYellowService,
    private jobService: JobService,
    private zipCodeService: ZipCodeService,
    private businessService: BusinessService,
    @InjectQueue(JOB_QUEUE)
    private scrapingQueue: Queue,
  ) {}

  async reJobAuto(id: string) {
    try {
      const job = await this.scrapingQueue.add(
        JOB_QUEUE_CHILD.AUTO_SEARCH_YELLOW,
        { jobId: id },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 0,
        },
      );

      return job;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createJobAuto(payload: JobAutoDto) {
    delete payload.source;
    try {
      const zipCodeList = await this.zipCodeService.readFileZipCode({});
      const statusData: any = zipCodeList?.stateList?.reduce((acc, item) => {
        acc[item] = { state: item, isFinish: false };
        return acc;
      }, {});

      const result = await this.jobService.create({
        ...payload,
        statusData,
        type: TYPE_JOB.AUTO,
      });

      await this.scrapingQueue.add(
        JOB_QUEUE_CHILD.AUTO_SEARCH_YELLOW,
        { jobId: result?.id },
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

  async runJobAuto(bull: Job<BullJob>) {
    const { jobId, userId } = bull.data;
    try {
      const job: JobEntity = await this.jobService.findById(jobId);
      const { statusData, createdAt, id } = job;
      const promisesState = Object?.values(statusData)?.map(
        (data: StatusDataItem) => {
          return async () => {
            if (data?.isFinish) return;
            return await this.autoSearchBusiness(job, data?.state);
          };
        },
      );
      const result = await promisesSequentially(promisesState, 1);
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

  async autoSearchBusiness(job: JobEntity, stateCode: string): Promise<any> {
    const { id, statusData, keyword } = job;
    const zipCodeTree = await this.zipCodeService.readFileZipCode({
      stateCode,
    });
    const zipCodeList = zipCodeTree?.countyList
      ?.map((i) => i?.zipCodeList)
      ?.flat(Infinity);
    try {
      const prosmisesZipCode = zipCodeList?.map((zipCode: string) => {
        return async () => {
          return await this.searchBusiness(keyword, zipCode);
        };
      });
      console.log(stateCode, prosmisesZipCode?.length);
      return await promisesSequentially(prosmisesZipCode, 20);
    } catch (e) {
      console.log(e);
    } finally {
      statusData[stateCode].isFinish = true;
      return await this.jobService.update(id, { statusData });
    }
  }

  async searchBusiness(keyword: string, zipCode: string) {
    try {
      let page = 0;
      while (true) {
        const url = `${WEBSITE.YELLOW_PAGES.URL}/search?search_terms=${keyword}&geo_location_terms=${zipCode}&page=${page}`;
        const response = await connectPage(url);
        const body = await response?.text();
        if (!body) break;
        const $ = cheerio.load(body);
        const businessList = await this.searchYellow.findElDetail($);
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
      }
    } catch (e) {
      console.log(e);
    } finally {
      console.log('End zipcode:', zipCode);
    }
  }
}
