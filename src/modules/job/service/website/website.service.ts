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
        },
      );
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
  async runJob(bull: Job<any>) {
    const { fetch, currentUser } = bull.data;
    const isAdmin = currentUser?.role === ROLE.admin;
    const browser = await puppeteer.use(StealthPlugin()).launch({
      ...OPTION_BROWSER,
    });
    try {
      const newFetch = {
        ...fetch,
        website: 'true',
        limit: '10000',
        statusWebsite: 1,
      } as FetchBusinessDto;

      const businessList = await this.businessService.findAllExport(
        newFetch,
        isAdmin,
      );
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
      if (!response)
        return await this.prisma.business.update({
          where: { id: business?.id },
          data: { statusWebsite: STATUS_WEBSITE.faild },
        });

      if (!thumbnailUrl) {
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

      const newBusiness = { email, thumbnailUrl };
      const result = await this.prisma.business.update({
        where: { id: business?.id },
        data: { ...newBusiness, statusWebsite: STATUS_WEBSITE.verify },
      });

      console.log('newBusiness', newBusiness);
      return result;
    } catch (e) {
      console.log(e);
      await this.prisma.business.update({
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
        timeout: 20000,
      })
      .catch(() => undefined);
    await setDelay(4000);
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
