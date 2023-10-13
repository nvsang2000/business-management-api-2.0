import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchBusinessService } from '../service/search-business.service';
import { BullJob } from 'src/interface';
import { AutoSearchBusinessService } from '../service/auto-search-business.service';

@Processor('job-queue')
export class BullJobQueue {
  constructor(
    private searchBusiness: SearchBusinessService,
    private autoSearchBusiness: AutoSearchBusinessService,
  ) {}

  @Process('auto-search-business-24h')
  async runBullAuto(bull: Job<BullJob>) {
    try {
      return await this.autoSearchBusiness.runJobAutoSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('search-business')
  async runBull(bull: Job<BullJob>) {
    try {
      return await this.searchBusiness.runJobSearch(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
