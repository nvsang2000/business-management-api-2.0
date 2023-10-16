import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchService } from '../service/search.service';
import { BullJob } from 'src/interface';
import { AutoSearchService } from '../service/auto-search.service';
import { AutoVerifyService } from '../service/auto-verify.service';

@Processor('job-queue')
export class BullJobQueue {
  constructor(
    private autoVerify: AutoVerifyService,
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

  @Process('auto-verify-24h')
  async runBullVerify(bull: Job<BullJob>) {
    try {
      return await this.autoVerify.runJobAutoVerify(bull);
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
}
