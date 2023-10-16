/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JobService } from '../job.service';
import { BusinessService } from 'src/modules/business/business.service';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { JobAutoDto } from '../dto';
import { UserEntity } from 'src/entities';
import {
  DEFAULT_OPTION_HEADER_FETCH,
  JOB_STATUS,
  METHOD,
  TYPE_JOB,
  WEBSITE,
} from 'src/constants';
import { BullJob } from 'src/interface';
import { JobEntity } from 'src/entities/job.entity';
import {
  formatPhoneNumber,
  parseUSAddress,
  promisesSequentially,
  setDelay,
} from 'src/helper';
import dayjs from 'dayjs';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { CreateScratchBusinessDto } from 'src/modules/business/dto';
import * as cheerio from 'cheerio';

interface StatusDataItem {
  state: string;
  isFinish: boolean;
  page: number;
  messageError?: any;
}

@Injectable()
export class AutoSearchService {
  constructor(
    private jobService: JobService,
    private businessService: BusinessService,
    private zipCodeService: ZipCodeService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async reJobAutoSearch(id: string, currentUser: UserEntity) {
    try {
      const job = await this.scrapingQueue.add(
        'auto-search-24h',
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

  async createJobAutoSearch(payload: JobAutoDto, currentUser: UserEntity) {
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
        'auto-search-24h',
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

  async runJobAutoSearch(bull: Job<BullJob>) {
    const { jobId, userId } = bull.data;
    try {
      const job: JobEntity = await this.jobService.findById(jobId);
      const { statusData, createdAt, id } = job;
      const promises = Object?.values(statusData)?.map(
        (data: StatusDataItem) => {
          return async () => {
            if (data?.isFinish) return;
            return await this.autoSearchBusiness(job, data?.state);
          };
        },
      );
      const result = await promisesSequentially(promises, 1);
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
      const prosmises = zipCodeList?.map((zipCode: string) => {
        return async () => {
          return await this.searchBusiness(keyword, zipCode);
        };
      });
      console.log('prosmises', prosmises?.length);
      await promisesSequentially(prosmises, 10);
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
            await this.businessService.createScratchBusiness(business);
          else if (checkScratch) {
            if (checkScratch?.googleVerify) continue;
            await this.businessService.updateScratchBusiness(
              checkScratch?.id,
              business,
            );
          }
        }

        const nextPage = $(WEBSITE.YELLOW_PAGES.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;
      }
    } catch (e) {
      console.log(e);
    }
  }

  async connectPage(keyword: string, zipCode: string, page: number) {
    let tryCount = 0;
    while (tryCount < 5) {
      try {
        const url = `${WEBSITE.YELLOW_PAGES.URL}/search?search_terms=${keyword}&geo_location_terms=${zipCode}&page=${page}`;
        const response = await fetch(url, {
          method: METHOD.GET,
          headers: DEFAULT_OPTION_HEADER_FETCH,
        });
        tryCount > 0 && console.log('tryCount', tryCount);
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
