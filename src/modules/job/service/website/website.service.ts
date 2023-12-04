import { InjectQueue } from '@nestjs/bull';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import {
  DOMAIN_LINK,
  EXPORT_ALL_LIMIT,
  JOB_QUEUE,
  JOB_QUEUE_CHILD,
  MATCH_WEBSITE,
  PROMISE_WEBSITE_LIMIT,
  REGEX_PHONE_NUMBER,
  REG_IS_EMAIL,
  REG_IS_WEBSITE,
  STATUS_WEBSITE,
} from 'src/constants';
import { BusinessEntity } from 'src/entities';
import {
  connectPage,
  coverPhoneNumber,
  promisesSequentially,
} from 'src/helper';
import { BusinessService } from 'src/modules/business/business.service';
import { FetchBusinessDto } from 'src/modules/business/dto';
import * as cheerio from 'cheerio';
import * as url from 'url';
@Injectable()
export class WebsiteSerivce {
  constructor(
    private prisma: PrismaService,
    private businessService: BusinessService,
    private configService: ConfigService,
    @InjectQueue(JOB_QUEUE)
    private scrapingQueue: Queue,
  ) {}

  async createJob(fetch: FetchBusinessDto) {
    try {
      const result = await this.scrapingQueue.add(
        JOB_QUEUE_CHILD.WEBSITE,
        { fetch },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 0,
          timeout: 1000,
        },
      );
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
  async runJob(bull: Job<any>) {
    const { fetch } = bull.data;
    const limit = await this.configService.get(PROMISE_WEBSITE_LIMIT);
    try {
      const newFetch = {
        ...fetch,
        website: 'true',
        matchAddress: 1,
        matchPhone: 1,
      } as FetchBusinessDto;

      const businessList = await this.handleFindAllData(newFetch);
      console.log('businessList', businessList?.length);
      const promiseCreateBrowser = businessList?.map((data) => {
        return async () => {
          return await this.createBrowser(data);
        };
      });
      const result = await promisesSequentially(promiseCreateBrowser, +limit);
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async handleFindAllData(fetchDto: FetchBusinessDto) {
    const allLimit = await this.configService.get(EXPORT_ALL_LIMIT);
    try {
      let businessList = [],
        hasMore = true,
        cursor = null,
        index = 0;
      while (hasMore) {
        const businessMore = await this.businessService.findAllScratch(
          { ...fetchDto, limit: +allLimit },
          cursor,
        );
        const length = businessMore?.length;
        if (length === 1 || length === 0) hasMore = false;
        else {
          businessList = businessList.concat(businessMore);
          cursor = businessMore[length - 1].id;
        }
        index++;
        console.log('cursor: ', index, cursor);
      }
      return businessList;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createBrowser(business: BusinessEntity) {
    if (business?.website?.includes(DOMAIN_LINK.facebook))
      return await this.updateBusinessFaild(business?.id);

    try {
      const response = await connectPage(business?.website);
      if (!response) return await this.updateBusinessFaild(business?.id);

      const body = await response?.text();
      const $ = cheerio.load(body, { scriptingEnabled: false });

      const inforPageHome = await this.findInforBusiness(business, $);
      const email = inforPageHome?.email;
      const matchAddress = inforPageHome?.arrayTextAddress;
      const matchPhone = inforPageHome?.arrayTextPhone;
      if (inforPageHome?.contactUrl) {
        const response = await connectPage(inforPageHome?.contactUrl);
        if (!response) return;
        const body = await response?.text();
        const $ = cheerio.load(body, { scriptingEnabled: false });
        const inforContact = await this.findInforBusiness(business, $);
        if (inforContact) {
          !email && email === inforContact?.email;
          matchAddress === inforContact?.arrayTextAddress;
          matchPhone === inforContact?.arrayTextPhone;
        }
      }

      const newBusiness = {
        email,
        matchPhone:
          matchPhone?.length > 0
            ? MATCH_WEBSITE.MATCH
            : MATCH_WEBSITE.NOT_MATCH,
        matchAddress:
          matchAddress?.length > 0
            ? MATCH_WEBSITE.MATCH
            : MATCH_WEBSITE.NOT_MATCH,
      };
      console.log('result: ', newBusiness);
      const result = await this.prisma.business.update({
        where: { id: business?.id },
        select: { id: true },
        data: newBusiness,
      });
      return result;
    } catch (e) {
      console.log(e);
      return await this.updateBusinessFaild(business?.id);
    }
  }

  async findInforBusiness(business: BusinessEntity, $: any) {
    const { website, city, state, zipCode, phone } = business;

    const coverPhone = coverPhoneNumber(phone);
    const addressFormat = `${city}, ${state} ${zipCode}`;
    const arrayTextPhone = [];
    $(`div:contains(${coverPhone})`)
      ?.contents()
      ?.map((i: number, els: Element) => {
        const textPhone = $(els)?.text()?.toLowerCase()?.trim();
        const findPhone = textPhone.match(REGEX_PHONE_NUMBER);
        if (findPhone && findPhone?.includes(coverPhone)) {
          arrayTextPhone.push(...findPhone);
        }
      });

    const arrayTextAddress = [];
    $(`div:contains(${addressFormat})`)
      ?.contents()
      ?.map((i: number, els: Element) => {
        const textAddress = $(els)?.text()?.toLowerCase()?.trim();
        if (textAddress?.length < 100 && textAddress?.length > 10) {
          arrayTextAddress.push(textAddress);
        }
      });

    const arrayTextlinks = [];
    $('a')?.map((i: number, els: any) => {
      const link = $(els)?.attr('href')?.toLowerCase()?.trim();
      const text = $(els)?.text()?.toLowerCase()?.trim();
      const match = link?.match(REG_IS_WEBSITE);
      if (link?.includes('mailto:')) {
        const email = link?.replace('mailto:', '');
        if (email?.match(REG_IS_EMAIL)) {
          const object = { email };
          return arrayTextlinks?.push(object);
        }
      }
      if (match && match?.length > 4 && text?.includes('contact')) {
        const parsedUrl = url.parse(link);
        const parsedWebsite = url.parse(website);
        const object = {
          contact: parsedUrl?.hostname
            ? link
            : `${parsedWebsite?.hostname}${parsedUrl?.pathname}`,
        };
        return arrayTextlinks?.push(object);
      }
    });

    const emails = arrayTextlinks?.filter((link) => link?.email);
    const contacts = arrayTextlinks?.filter((link) => link?.contact);
    const newBusiness = {
      arrayTextPhone,
      arrayTextAddress,
      email: emails?.[0]?.email,
      contactUrl: contacts?.[0]?.contact,
    };
    return newBusiness;
  }

  async updateBusinessFaild(id: string) {
    return await this.prisma.business.update({
      where: { id },
      select: { id: true },
      data: {
        statusWebsite: STATUS_WEBSITE.FAILD,
        matchPhone: 3,
        matchAddress: 3,
      },
    });
  }
}
