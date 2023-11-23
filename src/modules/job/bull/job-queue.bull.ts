import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchYellowService } from '../service/yellow/search.service';
import { BullJob } from 'src/interface';
import { AutoSearchYellowService } from '../service/yellow/auto.service';
import { AutoSearchYelpService } from '../service/yelp/auto.service';
import { SearchYelpService } from '../service/yelp/search.service';
import { AutoSearchMenufySerivce } from '../service/menufy/auto.service';
import { WebsiteSerivce } from '../service/website/website.service';
import { JOB_QUEUE, JOB_QUEUE_CHILD } from 'src/constants';

@Processor(JOB_QUEUE)
export class BullJobQueue {
  constructor(
    private website: WebsiteSerivce,
    private searchYelp: SearchYelpService,
    private searchYellow: SearchYellowService,
    private autoSearchYelp: AutoSearchYelpService,
    private autoSearchYellow: AutoSearchYellowService,
    private autoSearchMenufy: AutoSearchMenufySerivce,
  ) {}

  @Process(JOB_QUEUE_CHILD.SEARCH_YELLOW)
  async runBullSearchYellow(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.searchYellow.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process(JOB_QUEUE_CHILD.SEARCH_YELP)
  async runBullSearchYelp(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.searchYelp.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process(JOB_QUEUE_CHILD.AUTO_SEARCH_YELLOW)
  async runBullAutoSearchYellow(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.autoSearchYellow.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process(JOB_QUEUE_CHILD.AUTO_SEARCH_YELP)
  async runBullAutoSearchYelp(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.autoSearchYelp.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process(JOB_QUEUE_CHILD.AUTO_SEARCH_MENUFY)
  async runBullAutoSearchMenufy(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.autoSearchMenufy.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process(JOB_QUEUE_CHILD.WEBSITE)
  async runBullScreenshots(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.website.runJob(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
