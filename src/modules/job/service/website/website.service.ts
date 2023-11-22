import { InjectQueue } from '@nestjs/bull';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import {
  DOMAIN_LINK,
  EXPORT_ALL_LIMIT,
  PROMISE_WEBSITE_LIMIT,
  REG_IS_EMAIL,
  REG_IS_WEBSITE,
  ROLE,
  STATUS_WEBSITE,
} from 'src/constants';
import { BusinessEntity, UserEntity } from 'src/entities';
import { connectPage, promisesSequentially } from 'src/helper';
import { BusinessService } from 'src/modules/business/business.service';
import { FetchBusinessDto } from 'src/modules/business/dto';
import * as cheerio from 'cheerio';

@Injectable()
export class WebsiteSerivce {
  constructor(
    private prisma: PrismaService,
    private businessService: BusinessService,
    private configService: ConfigService,
    @InjectQueue(`job-queue-${process.env.REDIS_SERVER}`)
    private scrapingQueue: Queue,
  ) {}

  async createJob(fetch: FetchBusinessDto, currentUser: UserEntity) {
    try {
      const result = await this.scrapingQueue.add(
        'website',
        { fetch, currentUser },
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
    const { fetch, currentUser } = bull.data;
    const limit = await this.configService.get(PROMISE_WEBSITE_LIMIT);
    try {
      const newFetch = {
        ...fetch,
        website: 'true',
        statusWebsite: 1,
      } as FetchBusinessDto;

      const businessList = await this.handleFindAllData(newFetch, currentUser);
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

  async handleFindAllData(
    fetchDto: FetchBusinessDto,
    currentUser: UserEntity = null,
  ) {
    const isAdmin = currentUser?.role === ROLE.admin;
    const allLimit = await this.configService.get(EXPORT_ALL_LIMIT);
    try {
      let businessList = [],
        hasMore = true,
        cursor = null,
        index = 0;
      while (hasMore) {
        const businessMore = await this.businessService.findAllExport(
          { ...fetchDto, limit: +allLimit },
          isAdmin,
          cursor,
        );
        if (businessMore.length === 1) hasMore = false;
        else {
          businessList = businessList.concat(businessMore);
          cursor = businessMore[businessMore.length - 1].id;
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
      return await this.prisma.business.update({
        where: { id: business?.id },
        data: { statusWebsite: STATUS_WEBSITE.faild },
      });

    try {
      let email: string, thumbnailUrl: any;
      email = business?.email;
      const response = await connectPage(business?.website);
      if (!response) {
        console.log('error: ', business?.website);
        return await this.prisma.business.update({
          where: { id: business?.id },
          data: { statusWebsite: STATUS_WEBSITE.faild },
        });
      }
      const body = await response?.text();
      const $ = cheerio.load(body);
      const links = await this.findInforBusiness(business, $);

      const emails = links?.filter((link) => link?.email);
      const contacts = links?.filter((link) => link?.contact);
      if (emails?.length > 0) email = emails?.[0]?.email;
      else if (contacts?.length > 0) {
        const response = await connectPage(contacts?.[0]?.contact);
        if (!response) return;
        const body = await response?.text();
        const $ = cheerio.load(body);
        const contactLink = await this.findInforBusiness(business, $);
        const emailToContact = contactLink?.filter((link) => link?.email);
        if (emailToContact?.length > 0) email = emailToContact?.[0]?.email;
      }

      const result = await this.prisma.business.update({
        where: { id: business?.id },
        data: { email, thumbnailUrl, statusWebsite: STATUS_WEBSITE.verify },
      });

      console.log('result:', email, business?.website);
      return result;
    } catch (e) {
      console.log(e);
      return await this.prisma.business.update({
        where: { id: business?.id },
        data: { statusWebsite: STATUS_WEBSITE.faild },
      });
    }
  }

  async findInforBusiness(business: BusinessEntity, $: any) {
    const links = [];
    $('a')?.map((i: number, els: any) => {
      const link = $(els)?.attr('href')?.trim();
      const text = $(els)?.text()?.toLowerCase()?.trim();
      if (link?.includes('mailto:')) {
        const email = link?.replace('mailto:', '');
        if (email?.match(REG_IS_EMAIL)) {
          const object = { email };
          return links?.push(object);
        }
      }
      if (text?.includes('contact')) {
        const match = link?.match(REG_IS_WEBSITE);
        const object = {
          contact: match ? link : `${business?.website}${link}`,
        };
        return links?.push(object);
      }
    });
    return links;
  }
}
