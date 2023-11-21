import { BusinessService } from 'src/modules/business/business.service';
import { JobService } from '../../job.service';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BusinessEntity, UserEntity } from 'src/entities';
import {
  JOB_STATUS,
  MAPPING_CATEGORIES,
  SOURCE_SCRATCH,
  TYPE_JOB,
  WEBSITE,
} from 'src/constants';
import { UnprocessableEntityException } from '@nestjs/common';
import { BullJob } from 'src/interface';
import {
  connectPage,
  formatPhoneNumber,
  promisesSequentially,
} from 'src/helper';
import * as cheerio from 'cheerio';
import { JobEntity } from 'src/entities/job.entity';
import dayjs from 'dayjs';

interface StatusDataItem {
  state: string;
  isFinish: boolean;
  messageError?: any;
}

export class AutoSearchMenufySerivce {
  constructor(
    private jobService: JobService,
    private businessService: BusinessService,
    @InjectQueue(`job-queue-${process.env.REDIS_SERVER}`)
    private scrapingQueue: Queue,
  ) {}

  async reJobAuto(id: string, currentUser: UserEntity) {
    try {
      const job = await this.scrapingQueue.add(
        'auto-search-menufy',
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

  async createJobAuto(currentUser: UserEntity) {
    try {
      const url = WEBSITE.MENUFY.URL;
      const response = await connectPage(url);
      const body = await response?.text();
      const $ = cheerio.load(body);
      const stateUrl = [];
      $('#states .container .state-columns a')?.map((i, el) => {
        const url = $(el)?.attr('href');
        stateUrl.push(url);
      });
      const statusData: any = stateUrl?.reduce((acc, item) => {
        acc[item] = { state: item, isFinish: false };
        return acc;
      }, {});

      const userId = currentUser?.id;
      const result = await this.jobService.create(
        { statusData, type: TYPE_JOB.AUTO },
        userId,
      );

      await this.scrapingQueue.add(
        'auto-search-menufy',
        { jobId: result?.id, userId },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 20,
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
            return await this.getCityList(job, data?.state);
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
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async getCityList(job: JobEntity, stateCode: string) {
    const { id, statusData } = job;
    try {
      const url = `${WEBSITE.MENUFY.URL}${stateCode}`;
      const response = await connectPage(url);
      const body = await response?.text();
      const $ = cheerio.load(body);
      const cityUrlList = [];
      $('.cities a')?.map((i, el) => {
        const url = $(el)?.attr('href');
        cityUrlList.push(url);
      });
      const promisesCity = cityUrlList?.map((city: string) => {
        return async () => {
          return await this.getBusinessList(city);
        };
      });
      await promisesSequentially(promisesCity, 1);
      statusData[stateCode].isFinish = true;
      return await this.jobService.update(id, { statusData });
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async getBusinessList(city: string) {
    try {
      const url = `${WEBSITE.MENUFY.URL}${city}`;
      const response = await connectPage(url);
      const body = await response?.text();
      const $ = cheerio.load(body);
      const businessList = [];
      $('#first-list .restaurant')?.map((i, el) => {
        const website = $(el)?.attr('href');
        const thumbnailUrl = $(el)?.find('.thumbnail img')?.attr('src');
        const categories = $(el)?.find('.cuisines')?.text()?.trim();
        const arrayCategories = categories?.split(', ');
        const mappingCategories = arrayCategories
          ?.map((category: string) => {
            const mapping = MAPPING_CATEGORIES[category];
            return mapping ? mapping : category;
          })
          .filter((i) => i !== '');
        const business = {
          website,
          thumbnailUrl,
          categories:
            mappingCategories?.length === 0
              ? ['Restaurants']
              : mappingCategories,
        };
        businessList.push(business);
      });
      console.log('business: ', businessList?.length);
      const promisesBusinessDetail = businessList?.map((business) => {
        return async () => {
          return await this.getBusinessDetail(business);
        };
      });
      return await promisesSequentially(promisesBusinessDetail, 10);
    } catch (e) {
      console.log(e);
    }
  }

  async getBusinessDetail(business: BusinessEntity) {
    try {
      const response = await connectPage(business?.website);
      const body = await response?.text();
      const $ = cheerio.load(body);
      let phone: string,
        address: string,
        city: string,
        state: string,
        zipCode: string;
      const name = $('.restaurant-name').text();
      $('.d-block .d-inline-block a')?.map((i, el) => {
        const addressOrPhone = $(el)?.attr('href');
        if (addressOrPhone?.includes('https://maps.google.com')) {
          const addressEL = $(el).html().trim();
          const removeZipCode4 = addressEL?.replace(/\b\-\d{4}\b/, '');
          const parts = removeZipCode4.split('<br>');
          address = parts[0];
          const partsCityStateZipCode = parts[1].split(', ');
          city = partsCityStateZipCode[0];
          const partsStateZipCode = partsCityStateZipCode[1].split(' ');
          state = partsStateZipCode[0];
          zipCode = partsStateZipCode[1];
        }
        if (addressOrPhone?.includes('tel:')) phone = $(el).text();
      });
      if (!name || !address || !city || !state || !zipCode) return;
      const newBusiness: any = {
        ...business,
        name: name?.replace('Online Ordering Menu', '').trim(),
        phone: formatPhoneNumber(phone),
        scratchLink: business?.website,
        source: SOURCE_SCRATCH.MENUFY,
        address,
        city,
        zipCode,
        state,
      };
      return await this.businessService.saveScratchBusiness(newBusiness, false);
    } catch (e) {
      console.log(e);
    }
  }
}
