import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchYellowService } from '../service/yellow/search.service';
import { BullJob } from 'src/interface';
import { AutoSearchYellowService } from '../service/yellow/auto.service';
import { AutoSearchYelpService } from '../service/yelp/auto.service';
import { SearchYelpService } from '../service/yelp/search.service';
import { AutoSearchMenufySerivce } from '../service/menufy/auto.service';

@Processor(`job-queue-${process.env.REDIS_SERVER}`)
export class BullJobQueue {
  constructor(
    private searchYelp: SearchYelpService,
    private searchYellow: SearchYellowService,
    private autoSearchYelp: AutoSearchYelpService,
    private autoSearchYellow: AutoSearchYellowService,
    private autoSearchMenufy: AutoSearchMenufySerivce,
  ) {}

  @Process('search-yellow')
  async runBullSearchYellow(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.searchYellow.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('search-yelp')
  async runBullSearchYelp(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.searchYelp.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('auto-search-yellow')
  async runBullAutoSearchYellow(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.autoSearchYellow.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('auto-search-yelp')
  async runBullAutoSearchYelp(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.autoSearchYelp.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('auto-search-menufy')
  async runBullAutoSearchMenufy(bull: Job<BullJob>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.autoSearchMenufy.runJobAuto(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
