/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JobAutoDto } from '../../dto';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  JOB_QUEUE,
  JOB_QUEUE_CHILD,
  JOB_STATUS,
  TYPE_JOB,
  WEBSITE,
} from 'src/constants';
import * as cheerio from 'cheerio';
import { connectPage, promisesSequentially } from 'src/helper';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { JobService } from '../../job.service';
import { BullJob } from 'src/interface';
import { JobEntity } from 'src/entities/job.entity';
import dayjs from 'dayjs';
import { SearchYelpService } from './search.service';

@Injectable()
export class AutoSearchYelpService {
  constructor(
    private searchYelp: SearchYelpService,
    private zipCodeService: ZipCodeService,
    private jobService: JobService,
    @InjectQueue(JOB_QUEUE)
    private scrapingQueue: Queue,
  ) {}

  async reJobAuto(id: string) {
    try {
      const job = await this.scrapingQueue.add(
        JOB_QUEUE_CHILD.AUTO_SEARCH_YELP,
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
        JOB_QUEUE_CHILD.AUTO_SEARCH_YELP,
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
      const promisesState = Object?.values(statusData)?.map((data: any) => {
        return async () => {
          if (data?.isFinish) return;
          return await this.searchWithManyZipCode(job, data?.state);
        };
      });
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
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async searchWithManyZipCode(job: JobEntity, stateCode: string): Promise<any> {
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
          return await this.searchWithZipCode(keyword, zipCode);
        };
      });
      console.log(stateCode, prosmisesZipCode?.length);
      return await promisesSequentially(prosmisesZipCode, 10);
    } catch (e) {
      console.log(e?.message);
    } finally {
      statusData[stateCode].isFinish = true;
      return await this.jobService.update(id, { statusData });
    }
  }

  async searchWithZipCode(keyword: string, zipCode: string): Promise<any> {
    try {
      let page = 0;
      const businessListForPage = [];
      while (true) {
        const url = `${WEBSITE.YELP.URL}search?find_desc=${keyword}&find_loc=${zipCode}&start=${page}0`;
        const response = await connectPage(url);
        const body = await response?.text();
        if (!body) break;
        const $ = cheerio.load(body);

        const businessList = await this.searchYelp.findElList($);
        businessListForPage.push(...businessList);

        const nextPage = $(WEBSITE.YELP.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;
      }
      if (businessListForPage?.length === 0) return;
      else {
        const promiseGetDetail = businessListForPage?.map((business) => {
          return async () => {
            return await this.searchYelp.saveBusiness({ ...business, keyword });
          };
        });
        await promisesSequentially(promiseGetDetail, 10);
      }
    } catch (e) {
      console.log(e);
    } finally {
      console.log('End zipcode:', zipCode);
    }
  }
}
