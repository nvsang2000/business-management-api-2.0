/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JobAutoDto } from '../dto';
import { UserEntity } from 'src/entities';
import { BusinessService } from 'src/modules/business/business.service';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  DEFAULT_OPTION_HEADER_FETCH,
  METHOD,
  TYPE_JOB,
  WEBSITE,
} from 'src/constants';
import * as cheerio from 'cheerio';
import { promisesSequentially, setDelay } from 'src/helper';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { JobService } from '../job.service';
import { BullJob } from 'src/interface';
import { JobEntity } from 'src/entities/job.entity';

@Injectable()
export class AutoVerifyService {
  constructor(
    private zipCodeService: ZipCodeService,
    private business: BusinessService,
    private jobService: JobService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async createJobAutoVerify(payload: JobAutoDto, currentUser: UserEntity) {
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
        'auto-verify-24h',
        { ...payload, statusData, type: TYPE_JOB.AUTO },
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

  async runJobAutoVerify(bull: Job<BullJob>) {
    const { jobId } = bull.data;
    try {
      const job: JobEntity = await this.jobService.findById(jobId);
      const { statusData } = job;
      const promises = Object?.values(statusData)?.map((data: any) => {
        return async () => {
          if (data?.isFinish) return;
          return await this.getList(job, data?.state);
        };
      });
      console.log('result');
      await promisesSequentially(promises, 4);
      // console.log('result', result);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async getList(job: JobEntity, stateCode: string): Promise<any> {
    const { keyword } = job;
    try {
      let page = 0;
      const businessListForPage = [];
      while (true) {
        const url = `${WEBSITE.YELP.URL}search?find_desc=${keyword}&find_loc=${stateCode}&start=${page}0`;
        const result = await fetch(url).then((response) => response.text());
        const $ = cheerio.load(result);

        $('[data-testid="serp-ia-card"]')?.map((i, el) => {
          const name = $(el)?.find('h3 span a')?.text();
          const thumbnailUrl = $(el)?.find('.css-eqfjza a img')?.attr('src');
          const url = $(el)?.find('.css-eqfjza a')?.attr('href');
          const scratchLink = `${WEBSITE.YELP.URL}${url}`;
          const item = { name, thumbnailUrl, scratchLink };

          return businessListForPage.push(item);
        });

        const nextPage = $(WEBSITE.YELP.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;
      }
    } catch (e) {
      console.log(e);
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
