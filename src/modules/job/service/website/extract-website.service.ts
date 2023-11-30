import { InjectQueue } from '@nestjs/bull';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import {
  BROWSER_HEADLESS,
  DOMAIN_LINK,
  JOB_QUEUE,
  JOB_QUEUE_CHILD,
  MATCH_WEBSITE,
  OPTION_BROWSER,
  PROMISE_WEBSITE_LIMIT,
  REGEX_PHONE_NUMBER,
  REG_IS_EMAIL,
  REG_IS_WEBSITE,
} from 'src/constants';
import { BusinessEntity, UserEntity } from 'src/entities';
import { promisesSequentially } from 'src/helper';
import { BusinessService } from 'src/modules/business/business.service';
import { FetchBusinessDto } from 'src/modules/business/dto';
import { WebsiteSerivce } from './website.service';

@Injectable()
export class ExtractWebsiteSerivce {
  constructor(
    private prisma: PrismaService,
    private websiteSerivce: WebsiteSerivce,
    private businessService: BusinessService,
    private configService: ConfigService,
    @InjectQueue(JOB_QUEUE)
    private scrapingQueue: Queue,
  ) {}

  async createJob(fetch: FetchBusinessDto, currentUser: UserEntity) {
    try {
      const result = await this.scrapingQueue.add(
        JOB_QUEUE_CHILD.EXTRACT_WEBSITE,
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
    const headless = await this.configService.get(BROWSER_HEADLESS);
    const browser = await puppeteer.use(StealthPlugin()).launch({
      ...OPTION_BROWSER,
      headless: headless === 'new' ? 'new' : false,
      slowMo: 50,
    });
    try {
      const newFetch = {
        ...fetch,
        matchPhone: 1,
        matchAddress: 1,
        website: 'true',
      } as FetchBusinessDto;

      const businessList = await this.websiteSerivce.handleFindAllData(
        newFetch,
        currentUser,
      );
      console.log('businessList', businessList?.length);
      const promiseCreateBrowser = businessList?.map((data) => {
        return async () => {
          return await this.createBrowser(browser, data);
        };
      });
      const result = await promisesSequentially(promiseCreateBrowser, +limit);
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    } finally {
      await browser.close();
    }
  }

  async createBrowser(browser: Browser, business: BusinessEntity) {
    const { city, state, zipCode, website, phone } = business;
    if (website?.includes(DOMAIN_LINK.facebook)) return;

    const page = await browser.newPage();
    await page.setViewport({ width: 1000, height: 800 });
    try {
      let { email } = business;
      let searchPhone: string,
        searchAddress = [];

      const response = await this.connectPage(website, page);
      if (!response) return;
      await this.scrollToEndOfPage(page);

      if (!email) email = await this.searchEmail(page);
      const contactUrls = await this.searchContactUrls(page);
      const searchText = `${city}, ${state} ${zipCode}`;
      searchAddress = await this.searchAddress(page, searchText);
      searchPhone = await this.searchPhone(page, phone);

      if (contactUrls?.length > 0) {
        await Promise.all([
          await page
            .goto(contactUrls[0], {
              waitUntil: 'domcontentloaded',
              timeout: 10000,
            })
            .catch(() => undefined),
        ]);

        if (!email) email = await this.searchEmail(page);
        if (!searchPhone) searchPhone = await this.searchPhone(page, phone);
        if (searchAddress?.length === 0)
          searchAddress = await this.searchAddress(page, searchText);
      }

      const newUpdate = {
        email,
        matchPhone:
          searchPhone?.length > 0
            ? MATCH_WEBSITE.MATCH
            : MATCH_WEBSITE.NOT_MATCH,
        matchAddress:
          searchAddress?.length > 0
            ? MATCH_WEBSITE.MATCH
            : MATCH_WEBSITE.NOT_MATCH,
      };

      const result = await this.prisma.business.update({
        where: { id: business?.id },
        data: newUpdate,
      });

      return result;
    } catch (e) {
      console.log(e);
    } finally {
      await page.close();
    }
  }

  async searchAddress(page: Page, search: string) {
    const select = `:scope >>> ::-p-text(${search})`;
    const address = await page
      ?.$$eval(select, (els: Element[]) => {
        return els?.map((el: Element) => {
          const textAddress = el.textContent.trim();
          if (textAddress?.length < 200) return textAddress;
        });
      })
      .catch(() => undefined);
    return address?.filter((address: string) => address);
  }

  async searchPhone(page: Page, search: string) {
    let phone: any;
    const textContent = await page.evaluate(() =>
      document.body.innerText.trim(),
    );
    phone = textContent.match(REGEX_PHONE_NUMBER);
    phone = phone && phone.map((n: string) => n.replace(/[^\d]/g, ''));
    return phone?.includes(search) ? phone : [];
  }

  async searchEmail(page: Page) {
    const email = await page
      ?.$eval('a[href^="mailto:"]', (el: Element) => {
        return el?.getAttribute('href')?.trim()?.replace('mailto:', '');
      })
      .catch(() => undefined);
    return email?.match(REG_IS_EMAIL) ? email : undefined;
  }

  async searchContactUrls(page: Page) {
    const contactUrl = await page.$$eval('a', (links) => {
      return links
        ?.filter((link) => {
          const linkText = link.textContent?.toLowerCase();
          return linkText && linkText.includes('contact');
        })
        ?.map((link) => link.href);
    });
    return contactUrl?.filter((url) => url && url?.match(REG_IS_WEBSITE));
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
