import { InjectQueue } from '@nestjs/bull';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import dayjs from 'dayjs';
import { PrismaService } from 'nestjs-prisma';
import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {
  API_HOST,
  ASSETS_THUMNAIL_DIR,
  DOMAIN_LINK,
  EXPORT_ALL_LIMIT,
  OPTION_BROWSER,
  REG_IS_EMAIL,
  REG_IS_WEBSITE,
  ROLE,
  STATUS_WEBSITE,
} from 'src/constants';
import { BusinessEntity, UserEntity } from 'src/entities';
import { promisesSequentially, setDelay } from 'src/helper';
import { BusinessService } from 'src/modules/business/business.service';
import { FetchBusinessDto } from 'src/modules/business/dto';
import { v4 as uuidv4 } from 'uuid';

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
    const browser = await puppeteer.use(StealthPlugin()).launch({
      ...OPTION_BROWSER,
      slowMo: 50,
    });
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
          return await this.createBrowser(browser, data);
        };
      });
      const result = await promisesSequentially(promiseCreateBrowser, 10);
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    } finally {
      await browser.close();
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
          { ...fetchDto, limit: allLimit },
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

  async createBrowser(browser: Browser, business: BusinessEntity) {
    if (business?.website?.includes(DOMAIN_LINK.facebook))
      return await this.prisma.business.update({
        where: { id: business?.id },
        data: { statusWebsite: STATUS_WEBSITE.faild },
      });

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    try {
      let email: string, thumbnailUrl: string;
      email = business?.email;
      thumbnailUrl = business?.thumbnailUrl;
      const response = await this.connectPage(business?.website, page);
      if (!response) {
        console.log('error: ', business?.website);
        return await this.prisma.business.update({
          where: { id: business?.id },
          data: { statusWebsite: STATUS_WEBSITE.faild },
        });
      }

      if (!thumbnailUrl) {
        await setDelay(4000);
        const apiHost = await this.configService.get(API_HOST);
        const dir = await this.configService.get(ASSETS_THUMNAIL_DIR);
        const fileName = `${dayjs().format('DD-MM-YYYY')}_${uuidv4()}.png`;
        const screen = await page
          .screenshot({
            path: `${dir}/${fileName}`,
            type: 'png',
          })
          .catch(() => undefined);
        thumbnailUrl = `${apiHost}assets/thumnail/${fileName}`;
        if (!screen)
          return await this.prisma.business.update({
            where: { id: business?.id },
            data: { statusWebsite: STATUS_WEBSITE.faild },
          });
      }

      //scroll and page, search email
      await this.scrollToEndOfPage(page);
      email = await page
        ?.$eval('a[href^="mailto:"]', (el: Element) => {
          return el?.getAttribute('href')?.trim()?.replace('mailto:', '');
        })
        .catch(() => undefined);

      email = email?.match(REG_IS_EMAIL) ? email : undefined;

      //not email current page
      if (!email) {
        const contactUrls = await page.$$eval('a', (links) => {
          return links
            ?.filter((link) => {
              const linkText = link.textContent?.toLowerCase();
              return linkText && linkText.includes('contact');
            })
            ?.map((link) => link.href);
        });
        const matchContactUrl = contactUrls?.filter((url) => {
          const match = url?.match(REG_IS_WEBSITE);
          return match && url;
        });
        if (matchContactUrl?.length > 0) {
          await Promise.all([
            await page
              .goto(matchContactUrl[0], {
                waitUntil: 'domcontentloaded',
                timeout: 10000,
              })
              .catch(() => undefined),
          ]);

          email = await page
            ?.$eval('a[href^="mailto:"]', (el: Element) => {
              return el?.getAttribute('href')?.trim()?.replace('mailto:', '');
            })
            .catch(() => undefined);

          email = email?.match(REG_IS_EMAIL) ? email : undefined;
        }
      }

      const result = await this.prisma.business.update({
        where: { id: business?.id },
        data: { email, thumbnailUrl, statusWebsite: STATUS_WEBSITE.verify },
      });

      email && console.log('email:', email);
      return result;
    } catch (e) {
      console.log(e);
      return await this.prisma.business.update({
        where: { id: business?.id },
        data: { statusWebsite: STATUS_WEBSITE.faild },
      });
    } finally {
      await page.close();
    }
  }

  async connectPage(url: string, page: Page) {
    const response = await page
      .goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      })
      .catch(() => undefined);
    if (response?.ok && response?.status() === 200) return response;
  }

  async scrollToEndOfPage(page: Page) {
    let previousHeight: any;
    let currentHeight = await page.evaluate('document.body.scrollHeight');
    while (previousHeight !== currentHeight) {
      previousHeight = currentHeight;
      await page.evaluate('window.scrollBy(0, document.body.scrollHeight)');
      currentHeight = await page.evaluate('document.body.scrollHeight');
    }
  }
}
