import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { JobAutoScratch } from 'src/interface';
import { SearchBusinessService } from '../service/search-business.service';

@Processor('scratch-queue')
export class BullSearchBusiness {
  constructor(private searchBusiness: SearchBusinessService) {}

  @Process('processing-scratch')
  async processScratch(job: Job<JobAutoScratch>) {
    try {
      return await this.searchBusiness.runJob(job);
    } catch (e) {
      console.log(e);
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
