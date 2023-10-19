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
  JOB_STATUS,
  MAPPING_CATEGORIES,
  REG_FORMAT_ADDRESS,
  REG_IS_WEBSITE,
  TYPE_JOB,
  WEBSITE,
} from 'src/constants';
import * as cheerio from 'cheerio';
import {
  connectPage,
  formatPhoneNumber,
  promisesSequentially,
} from 'src/helper';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { JobService } from '../job.service';
import { BullJob } from 'src/interface';
import { JobEntity } from 'src/entities/job.entity';
import dayjs from 'dayjs';

interface BusinessForList {
  name: string;
  thumbnailUrl: string;
  scratchLink: string;
}
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

  async runJobAutoVerify(bull: Job<BullJob>) {
    const { jobId, userId } = bull.data;
    try {
      const job: JobEntity = await this.jobService.findById(jobId);
      const { statusData, createdAt, id } = job;
      const promisesState = Object?.values(statusData)?.map((data: any) => {
        return async () => {
          if (data?.isFinish) return;
          return await this.parserZipCode(job, data?.state);
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

  async parserZipCode(job: JobEntity, stateCode: string): Promise<any> {
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
          return await this.getList(keyword, zipCode);
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

  async getList(keyword: string, zipCode: string): Promise<any> {
    try {
      let page = 0;
      const businessListForPage: BusinessForList[] = [];
      while (true) {
        const url = `${WEBSITE.YELP.URL}search?find_desc=${keyword}&find_loc=${zipCode}&start=${page}0`;
        const response = await connectPage(url);
        const body = await response?.text();
        const $ = cheerio.load(body);

        $('[data-testid="serp-ia-card"]')?.map((i, el) => {
          const name = $(el)?.find('h3 span a')?.text();
          const thumbnailUrl = $(el)?.find('.css-eqfjza a img')?.attr('src');
          const url = $(el)?.find('.css-eqfjza a')?.attr('href');
          const scratchLink = `${WEBSITE.YELP.URL}${url}`;
          const item = { name, thumbnailUrl, scratchLink };
          businessListForPage.push(item);
        });

        const nextPage = $(WEBSITE.YELP.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;
      }
      console.log(businessListForPage?.length, zipCode);
      if (businessListForPage?.length === 0) return;
      else {
        const promiseGetDetail = businessListForPage?.map((business) => {
          return async () => {
            return await this.getDetail(business);
          };
        });
        await promisesSequentially(promiseGetDetail, 1);
      }
    } catch (e) {
      console.log(e);
    }
  }

  async getDetail(business: BusinessForList) {
    const { scratchLink, name } = business;
    try {
      const response = await connectPage(scratchLink);
      const body = await response?.text();
      const $ = cheerio.load(body);

      const websiteAndPhone = $(
        'aside section .arrange-unit-fill__09f24__CUubG .css-1p9ibgf',
      )?.text();

      const address = $('address .css-r9996t a .raw__09f24__T4Ezm')?.text();
      const formatAddress = $('address  .css-qgunke span')?.text();
      if (!address || !formatAddress) return;
      const matches = formatAddress?.match(REG_FORMAT_ADDRESS);
      const city = matches[1];
      const state = matches[2];
      const zipCode = matches[3];

      let phone: string, website: string;
      if (websiteAndPhone) {
        const removeText = websiteAndPhone?.replace('Get Directions', '');
        const websiteMatch = removeText?.match(REG_IS_WEBSITE);
        website = websiteMatch ? websiteMatch?.[0] : undefined;
        phone = website ? removeText?.replace(website, '') : removeText;
      }
      const categories = [];
      $('.arrange-unit__09f24__rqHTg .css-1xfc281 .css-1fdy0l5 a').map(
        (i, el) => {
          const category = $(el).text();
          categories.push(category);
        },
      );

      const mappingCategories = categories?.map((category: string) => {
        const mapping = MAPPING_CATEGORIES[category];
        return mapping ? mapping : category;
      });

      const newBusiness = {
        ...business,
        website: website ? `https://www.${website}` : undefined,
        phone: phone ? formatPhoneNumber(phone) : undefined,
        address,
        city,
        state,
        zipCode,
        categories: mappingCategories,
      };

      const checkScratch = await this.business.findByScratchLink(scratchLink);
      const checkDulicate = await this.business.findFistOne(
        name,
        phone,
        address,
      );
      if (!checkScratch) {
        if (checkDulicate)
          await this.business.updateScratchBusiness(
            checkDulicate?.id,
            newBusiness,
          );
        else await this.business.createScratchBusiness(newBusiness);
      } else {
        await this.business.updateScratchBusiness(
          checkScratch?.id,
          newBusiness,
        );
      }
      //console.log('newBusiness', newBusiness);
    } catch (e) {
      console.log(e);
    }
  }
}
