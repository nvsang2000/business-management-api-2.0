/*
https://docs.nestjs.com/providers#services
*/

import { UnprocessableEntityException } from '@nestjs/common';
import { CreateJobSearchBusinessDto } from '../../dto';
import { UserEntity } from 'src/entities';
import { BusinessService } from 'src/modules/business/business.service';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  JOB_STATUS,
  MAPPING_CATEGORIES,
  REG_FORMAT_ADDRESS,
  SOURCE_SCRATCH,
  WEBSITE,
} from 'src/constants';
import * as cheerio from 'cheerio';
import {
  connectPage,
  formatPhoneNumber,
  promisesSequentially,
} from 'src/helper';
import { JobService } from '../../job.service';
import { BullJob } from 'src/interface';
import { JobEntity } from 'src/entities/job.entity';
import dayjs from 'dayjs';
import { CreateScratchBusinessDto } from 'src/modules/business/dto';

interface StatusDataItem {
  zipCode: string;
  isFinish: boolean;
  page: number;
  messageError?: any;
}

interface BusinessForList {
  name: string;
  thumbnailUrl: string;
  scratchLink: string;
}

export class SearchYelpService {
  constructor(
    private businessService: BusinessService,
    private jobService: JobService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async reJobSearch(id: string, currentUser: UserEntity) {
    try {
      const job = await this.scrapingQueue.add(
        'search-yelp',
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

      await this.scrapingQueue.add(
        'search-yelp',
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

  async searchWhithZipCode(job: JobEntity, payload) {
    const { id, statusData } = job;
    const { keyword, zipCode } = payload;
    try {
      let page = 0;
      const businessListForPage: BusinessForList[] = [];
      while (true) {
        const url = `${WEBSITE.YELP.URL}search?find_desc=${keyword}&find_loc=${zipCode}&start=${page}0`;
        const response = await connectPage(url);
        const body = await response?.text();
        const $ = cheerio.load(body);

        const businessList = await this.findElList($);
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
            return await this.saveBusiness(business);
          };
        });
        await promisesSequentially(promiseGetDetail, 10);
      }
    } catch (e) {
      console.log(e);
    } finally {
      statusData[zipCode].isFinish = true;
      return await this.jobService.update(id, { statusData });
    }
  }

  async saveBusiness(business: BusinessForList) {
    const { scratchLink } = business;
    try {
      const response = await connectPage(scratchLink);
      const body = await response?.text();
      const $ = cheerio.load(body);
      const detailEl = await this.findElDetail($);
      const newBusiness: CreateScratchBusinessDto = {
        ...business,
        ...detailEl,
        source: SOURCE_SCRATCH.YELP,
      };

      if (
        !newBusiness?.phone ||
        !newBusiness?.address ||
        !newBusiness?.city ||
        !newBusiness?.state ||
        !newBusiness?.zipCode
      )
        return;
      await this.businessService.saveScratchBusiness(newBusiness);
    } catch (e) {
      console.log(e);
    }
  }

  async findElList($: any) {
    const itemList = [];
    $(WEBSITE.YELP.ITEM_LIST)?.map((i: number, el: Element) => {
      const name = $(el)?.find('h3 span a')?.text();
      const thumbnailUrl = $(el)?.find('.css-eqfjza a img')?.attr('src');
      const url = $(el)?.find('.css-eqfjza a')?.attr('href');
      const scratchLink = `${WEBSITE.YELP.URL}${url}`;
      const item = { name, thumbnailUrl, scratchLink };
      itemList.push(item);
    });
    return itemList;
  }

  async findElDetail($: any) {
    const address = $(WEBSITE.YELP.DETAIL_ADDRESS)?.text();
    const formatAddress = $(WEBSITE.YELP.DETAIL_FORMAT_ADDRESS)?.text();
    if (!address || !formatAddress) return;
    const matches = formatAddress?.match(REG_FORMAT_ADDRESS);
    if (matches?.length < 3) return;
    const city = matches?.[1];
    const state = matches?.[2];
    const zipCode = matches?.[3];

    let phone: string, website: string;
    const websiteAndPhone = $(WEBSITE.YELP.DETAIL_WEB_PHONE)?.text();
    const removeText = websiteAndPhone?.replace('Get Directions', '');
    if (!removeText) return;
    if (websiteAndPhone) {
      const openParenIndex = removeText.indexOf('(');
      website = removeText.slice(0, openParenIndex);
      phone = removeText.slice(openParenIndex);
    }

    const categories = [];
    $(WEBSITE.YELP.DETAIL_CATEGORIES).map((i: number, el: Element) => {
      const category = $(el).text();
      categories.push(category);
    });
    const mappingCategories = categories?.map((category: string) => {
      const mapping = MAPPING_CATEGORIES[category];
      return mapping ? mapping : category;
    });

    return {
      website: website ? `https://www.${website}` : undefined,
      phone: phone ? formatPhoneNumber(phone) : undefined,
      address,
      city,
      state,
      zipCode,
      categories: mappingCategories,
    };
  }
}
