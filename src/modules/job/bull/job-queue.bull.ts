import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchYellowService } from '../service/yellow/search.service';
import { BullJob } from 'src/interface';
import { AutoSearchYellowService } from '../service/yellow/auto.service';
import { AutoSearchYelpService } from '../service/yelp/auto.service';
import { SearchYelpService } from '../service/yelp/search.service';

@Processor('job-queue')
export class BullJobQueue {
  constructor(
    private searchYelp: SearchYelpService,
    private searchYellow: SearchYellowService,
    private autoSearchYelp: AutoSearchYelpService,
    private autoSearchYellow: AutoSearchYellowService,
  ) {}

  @Process('search-yellow')
  async runBullSearchYellow(bull: Job<BullJob>) {
    try {
      console.log('bull', bull.data);
      return await this.searchYellow.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('auto-search-yellow')
  async runBullAutoSearchYellow(bull: Job<BullJob>) {
    try {
      console.log('bull', bull.data);
      return await this.autoSearchYellow.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('search-yelp')
  async runBullSearchYelp(bull: Job<BullJob>) {
    try {
      console.log('yelp', bull);
      return await this.searchYelp.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('auto-search-yelp')
  async runBullAutoSearchYelp(bull: Job<BullJob>) {
    try {
      console.log('bull', bull.data);
      return await this.autoSearchYelp.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
