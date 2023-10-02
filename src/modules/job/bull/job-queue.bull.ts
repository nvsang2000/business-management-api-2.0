import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchBusinessService } from '../service/search-business.service';
import { BullJob } from 'src/interface';

@Processor('job-queue')
export class BullJobQueue {
  constructor(private searchBusiness: SearchBusinessService) {}

  @Process('search-business')
  async runBull(bull: Job<BullJob>) {
    try {
      return await this.searchBusiness.runJob(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
