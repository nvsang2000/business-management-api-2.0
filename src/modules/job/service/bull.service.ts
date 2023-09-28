/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { UserEntity } from 'src/entities';
import { CreateJobSearchBusinessDto } from '../dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { JobService } from '../job.service';

@Injectable()
export class BullService {
  constructor(
    private jobService: JobService,
    @InjectQueue('scratch-queue')
    private scrapingQueue: Queue,
  ) {}

  async createJobProcessingScratch(
    payload: CreateJobSearchBusinessDto,
    currentUser: UserEntity,
  ) {
    try {
      const newPayload = {
        ...payload,
        county: payload?.county && [].concat(payload?.county).flat(Infinity),
        zipCode: [].concat(payload?.zipCode).flat(Infinity),
      };
      const result = await this.jobService.create(
        { ...newPayload },
        currentUser,
      );
      const dataQueue = {
        scratch: result,
        payload: newPayload,
        currentUser,
      };
      await this.scrapingQueue.add('processing-scratch', dataQueue, {
        removeOnComplete: true,
      });

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createJobReProcessingScratch(id: string, currentUser: UserEntity) {
    try {
      const result = await this.jobService.findUniqueBy(id);
      const zipCodeUnfinished = result?.zipCodeScratch?.filter(
        (i: any) => !i?.isFinish,
      );
      const dataQueue = { zipCodeUnfinished, currentUser };
      await this.scrapingQueue.add('re-processing-scratch', dataQueue, {
        removeOnComplete: true,
        attempts: 10,
        backoff: 100,
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async getJobList() {
    try {
      const jobs = await this.scrapingQueue.getJobs(['active']);
      return jobs.map((job) => {
        return {
          id: job.id,
          name: job.name,
          data: job.data,
          stacktrace: job.stacktrace,
          failedReason: job.failedReason,
        };
      });
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
