/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JOB_STATUS, REG_IS_STATE, WEBSITE } from 'src/constants';
import { Job } from 'bull';
import { BusinessService } from 'src/modules/business/business.service';
import {
  formatPhoneNumber,
  generateSlug,
  promisesSequentially,
  removeDuplicates,
  setDelay,
} from 'src/helper';
import { CategoryService } from 'src/modules/category/category.service';
import { UpsertScratchBusinessDto } from 'src/modules/business/dto';
import { WebhooksService } from './webhooks.service';
import dayjs from 'dayjs';
import * as cheerio from 'cheerio';
import { JobService } from '../job.service';
import { JobEntity } from 'src/entities/job.entity';

interface PayloadSearchBusiness {
  keyword: string;
  zipCode: string;
  page: number;
}
@Injectable()
export class SearchBusinessService {
  private limitPage: 30;

  constructor(
    private jobService: JobService,
    private businessService: BusinessService,
    private categoryService: CategoryService,
    private webhooks: WebhooksService,
  ) {}

  async runJob(bull: Job<JobEntity>) {
    try {
      const job = await this.jobService.findById(bull.data.id);
      const { statusData, keyword, createdAt, id } = job;
      const promises = Object?.values(statusData)?.map((data: any, index) => {
        return async () => {
          await setDelay(index * 1000);
          const newPayload = {
            keyword,
            zipCode: data?.zipCode,
            page: data?.page,
          };
          return this.searchBusiness(job, newPayload);
        };
      });

      await promisesSequentially(promises, this.limitPage);
      const duration = dayjs().diff(dayjs(createdAt));

      return await this.jobService.update(id, {
        duration,
        status: JOB_STATUS.COMPLETE,
      });
    } catch (e) {
      await bull.remove();
      throw new UnprocessableEntityException(e.message);
    }
  }
  async searchBusiness(
    job: JobEntity,
    payload: PayloadSearchBusiness,
  ): Promise<any> {
    const { id, statusData } = job;
    const { keyword, zipCode } = payload;
    try {
      let page = payload?.page;
      while (true) {
        const url = `${WEBSITE.YELLOW_PAGES.URL}/search?search_terms=${keyword}&geo_location_terms=${zipCode}&page=${page}`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const body = await response.text();
        const $ = cheerio.load(body);
        const businessListForPage = [];
        $('[class="search-results organic"] .result')?.map((i, el) => {
          let addressStreet = $(el)
            .find('.info-secondary .adr .street-address')
            .text();
          const addressLocality = $(el)
            .find('.info-secondary .adr .locality')
            .text();
          const name = $(el).find('.info-primary h2 .business-name').text();
          const categories = [];
          $(el)
            .find('.info-primary .categories a')
            .map((i, el) => categories.push($(el).text()));
          const phone = $(el).find('.info-secondary .phone').text();
          const thumbnailUrl = $(el)
            ?.find('.media-thumbnail-wrapper img')
            ?.attr('src');
          const scratchLink = $(el)?.find('.info-primary h2 a')?.attr('href');
          const website = $(el)
            ?.find('.info-primary .links a[target="_blank"]')
            ?.attr('href');

          let zipCode: string, state: string, city: string;
          if (addressLocality) {
            const addressParts = addressLocality.trim().split(',');
            const stateAndZip = addressParts[1]?.trim()?.split(' ') ?? [
              null,
              null,
            ];

            city = addressParts[0];
            state = stateAndZip[0];
            zipCode = stateAndZip[1];
          } else if (addressStreet) {
            const addressParts = addressLocality.split(',');
            if (addressParts.length > 1) {
              const lastParts = addressParts[addressParts.length - 1];
              const stateAndZip = lastParts.trim().split(' ');
              if (
                stateAndZip.length == 2 &&
                stateAndZip[1].match(REG_IS_STATE)
              ) {
                state = stateAndZip[0];
                zipCode = stateAndZip[1];
                if (addressParts.length > 2) {
                  // phần trước đó của state zip có thể là city
                  city = addressParts[addressParts.length - 2];
                  addressStreet = addressStreet
                    .slice(
                      0,
                      addressStreet.length - lastParts.length - city.length,
                    )
                    .trim();
                  city = city.trim();
                } else
                  addressStreet = addressStreet.slice(
                    0,
                    addressStreet.length - lastParts.length,
                  );
              } else city = lastParts;
            }
          }
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
            address: addressStreet,
          };
          businessListForPage.push(item);
        });
        const categorieEl = businessListForPage
          ?.map((i: any) => i.categories)
          ?.flat(Infinity);

        const categories = removeDuplicates(categorieEl)?.map(
          (name: string) => ({
            name,
            slug: generateSlug(name),
          }),
        );
        await this.categoryService.createMany(categories);
        for (const business of businessListForPage) {
          if (!business?.phone || !business?.address) continue;

          const newBusiness: UpsertScratchBusinessDto = {
            ...business,
            scratchLink: WEBSITE.YELLOW_PAGES.URL + business.scratchLink,
            phone: formatPhoneNumber(business.phone),
          };

          const checkBusiness = await this.businessService.findUniqueBy({
            address: business?.address,
            state: business?.state,
            zipCode: business?.zipCode,
          });

          if (!checkBusiness) {
            await this.businessService.createScratchBusiness(newBusiness);
          } else {
            await this.businessService.update(checkBusiness?.id, newBusiness);
          }
        }

        const nextPage = $(WEBSITE.YELLOW_PAGES.NEXT_PAGE).attr('href');
        if (!nextPage) break;
        page++;

        statusData[zipCode].page = page;
        console.log(`${payload.keyword}: `, statusData);
        await this.jobService.update(id, { statusData });
      }
    } catch (e) {
      console.log(e);
    }
  }
}
