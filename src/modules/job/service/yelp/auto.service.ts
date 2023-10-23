/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JobAutoDto } from '../../dto';
import { UserEntity } from 'src/entities';
import { BusinessService } from 'src/modules/business/business.service';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { JOB_STATUS, TYPE_JOB, WEBSITE } from 'src/constants';
import * as cheerio from 'cheerio';
import { connectPage, promisesSequentially } from 'src/helper';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { JobService } from '../../job.service';
import { BullJob } from 'src/interface';
import { JobEntity } from 'src/entities/job.entity';
import dayjs from 'dayjs';
import { PrismaService } from 'nestjs-prisma';
import { SearchYelpService } from './search.service';

interface BusinessForList {
  name: string;
  thumbnailUrl: string;
  scratchLink: string;
}

@Injectable()
export class AutoSearchYelpService {
  constructor(
    private searchYelp: SearchYelpService,
    private prisma: PrismaService,
    private zipCodeService: ZipCodeService,
    private business: BusinessService,
    private jobService: JobService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async reJobAuto(id: string, currentUser: UserEntity) {
    try {
      const job = await this.scrapingQueue.add(
        'auto-search-yelp',
        { jobId: id, userId: currentUser?.id },
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

  async createJobAuto(payload: JobAutoDto, currentUser: UserEntity) {
    delete payload.source;
    try {
      const zipCodeList = await this.zipCodeService.readFileZipCode({});
      const statusData: any = zipCodeList?.stateList?.reduce((acc, item) => {
        acc[item] = { state: item, isFinish: false };
        return acc;
      }, {});

      const userId = currentUser?.id;
      const result = await this.jobService.create(
        { ...payload, statusData, type: TYPE_JOB.AUTO },
        userId,
      );

      await this.scrapingQueue.add(
        'auto-search-yelp',
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
      console.log('prosmises', prosmisesZipCode?.length);
      await promisesSequentially(prosmisesZipCode, 10);
    } catch (e) {
      console.log(e);
    } finally {
      statusData[stateCode].isFinish = true;
      return await this.jobService.update(id, { statusData });
    }
  }

  async searchWithZipCode(keyword: string, zipCode: string): Promise<any> {
    try {
      let page = 0;
      const businessListForPage: BusinessForList[] = [];
      while (true) {
        const url = `${WEBSITE.YELP.URL}search?find_desc=${keyword}&find_loc=${zipCode}&start=${page}0`;
        const response = await connectPage(url);
        const body = await response?.text();
        const $ = cheerio.load(body);

        const businessList = await this.searchYelp.findElList($);
        businessListForPage.push(...businessList);

        const nextPage = $(WEBSITE.YELP.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;
      }
      console.log(businessListForPage?.length, zipCode);
      if (businessListForPage?.length === 0) return;
      else {
        const promiseGetDetail = businessListForPage?.map((business) => {
          return async () => {
            return await this.searchYelp.saveBusiness(business);
          };
        });
        await promisesSequentially(promiseGetDetail, 10);
      }
    } catch (e) {
      console.log(e);
    }
  }
}
