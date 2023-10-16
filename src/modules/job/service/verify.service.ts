/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { FetchVerifyDto } from '../dto';
import { UserEntity } from 'src/entities';
import { ConfigService } from '@nestjs/config';
import { BusinessService } from 'src/modules/business/business.service';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { BullJobVerify } from 'src/interface';
import { WEBSITE } from 'src/constants';
import * as cheerio from 'cheerio';
import { promisesSequentially } from 'src/helper';

@Injectable()
export class VerifyService {
  constructor(
    private configService: ConfigService,
    private business: BusinessService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async createJobVerify(fetchDto: FetchVerifyDto, currentUser: UserEntity) {
    try {
      const result = await this.scrapingQueue.add(
        'verify',
        { fetchDto, currentUser },
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

  async runJobVerify(bull: Job<BullJobVerify>) {
    const { fetchDto } = bull.data;
    try {
      const businessList = await this.business.findManyGoogleVerify({
        ...fetchDto,
      });

      const promises = businessList?.map((data) => {
        return async () => {
          const { address, city, state, zipCode, name } = data;
          const parseAddress = `${address}, ${city}, ${state} ${zipCode}`;
          const url = `${WEBSITE.YELP.URL}search?find_desc=${name}&find_loc=${parseAddress}&start=0`;
          return await this.getList(url);
        };
      });
      const result = await promisesSequentially(promises, 4);
      console.log('result', result);
    } catch (e) {}
  }

  async getList(url: string) {
    try {
      const result = await fetch(url).then((response) => response.text());
      const $ = cheerio.load(result);
      const businessList = [];
      $('[data-testid="serp-ia-card"]')?.map((i, el) => {
        const name = $(el)?.find('h3 span a')?.text();
        const thumbnailUrl = $(el)?.find('.css-eqfjza a img')?.attr('src');
        const url = $(el)?.find('.css-eqfjza a')?.attr('href');
        const scratchLink = `${WEBSITE.YELP.URL}${url}`;
        const item = { name, thumbnailUrl, scratchLink };

        return businessList.push(item);
      });
      return businessList;
    } catch (e) {
      console.log(e);
    }
  }
}
