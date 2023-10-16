import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchService } from '../service/search.service';
import { BullJob, BullJobVerify } from 'src/interface';
import { AutoSearchService } from '../service/auto-search.service';
import { VerifyService } from '../service/verify.service';

@Processor('job-queue')
export class BullJobQueue {
  constructor(
    private verify: VerifyService,
    private search: SearchService,
    private autoSearch: AutoSearchService,
  ) {}

  @Process('auto-search-24h')
  async runBullAuto(bull: Job<BullJob>) {
    try {
      return await this.autoSearch.runJobAutoSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('search')
  async runBullSearch(bull: Job<BullJob>) {
    try {
      return await this.search.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('verify')
  async runBullVerify(bull: Job<BullJobVerify>) {
    try {
      return await this.verify.runJobVerify(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
