import {
  OnGlobalQueueError,
  OnGlobalQueueFailed,
  OnQueueActive,
  OnQueueCompleted,
  Process,
  Processor,
} from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchBusinessService } from '../service/search-business.service';
import { JobEntity } from 'src/entities/job.entity';

@Processor('job-queue')
export class BullJobQueue {
  constructor(private searchBusiness: SearchBusinessService) {}

  @Process('search-business')
  async runBull(bull: Job<JobEntity>) {
    try {
      return await this.searchBusiness.runJob(bull);
    } catch (e) {
      console.log(e);
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @OnQueueActive()
  onActive(bull) {
    console.log(`Run job ${bull.id}`);
  }

  @OnQueueCompleted()
  onCompleted(bull) {
    console.log(`Completed job ${bull.id}`);
  }

  @OnGlobalQueueFailed()
  onFailed(bull) {
    console.log(`Failed job ${bull.id}`);
  }

  @OnGlobalQueueError()
  onError(bull) {
    console.log(`Error job ${bull.id}`);
  }
}
