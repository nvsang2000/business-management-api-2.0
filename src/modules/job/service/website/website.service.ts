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
  FILE_TYPE,
} from 'src/constants';
import { BusinessEntity } from 'src/entities';
import { promisesSequentially } from 'src/helper';
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

  async createJob(fetch: FetchBusinessDto) {
    try {
      const result = await this.scrapingQueue.add(
        'screenshots',
        { fetch },
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
    const { fetch } = bull.data;
    try {
      const newFetch = {
        ...fetch,
        website: 'true',
        thumbnailUrl: 'false',
        isWebsite: false,
        limit: '10000',
      } as FetchBusinessDto;
      console.log('newFetch', newFetch);
      const businessList = await this.businessService.findAllExport(newFetch);
      const promiseCreateBrowser = businessList?.map((data) => {
        return async () => {
          return await this.createBrowser(data);
        };
      });
      const result = await promisesSequentially(promiseCreateBrowser, 10);
      console.log('end job screenshots');
      return result;
    } catch (e) {
      console.log(e);
    }
  }

  async createBrowser(business: BusinessEntity) {
    if (business?.website?.includes(DOMAIN_LINK.facebook)) return;
    const browser = await puppeteer.use(StealthPlugin()).launch({
      headless: 'new',
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--deterministic-fetch',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    try {
      const apiHost = await this.configService.get(API_HOST);
      const dir = await this.configService.get(ASSETS_THUMNAIL_DIR);
      const fileName = `${dayjs().format('DD-MM-YYYY')}_${uuidv4()}.png`;
      const response = await this.connectPage(business?.website, browser, page);
      if (!response) return;
      const title = await page.title();
      const bodyEl = await page.$('body');
      const bodyContent = await page
        .evaluate((el: Element) => el.textContent, bodyEl)
        .catch(() => undefined);
      if (!title && bodyContent?.length < 2000) return;
      await page.screenshot({
        path: `${dir}/${fileName}`,
      });
      const url = `${apiHost}assets/thumnail/${fileName}`;
      await this.prisma.file.create({
        data: {
          url,
          name: fileName,
          type: FILE_TYPE.image,
          dirFile: dir,
        },
      });

      const result = await this.prisma.business.update({
        where: { id: business?.id },
        data: { thumbnailUrl: url, isWebsite: true },
      });

      console.log('url', url);
      return result;
    } catch (e) {
      console.log(e);
    } finally {
      await page.close();
      await browser.close();
    }
  }

  async connectPage(url: string, browser: Browser, page: Page) {
    try {
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      if (response.ok && response.status() === 200) return response;
    } catch (e) {
      console.log(e);
    }
  }
}
