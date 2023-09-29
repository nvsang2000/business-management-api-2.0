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
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  async createJob(
    createJob: CreateJobSearchBusinessDto,
    currentUser: UserEntity,
  ) {
    try {
      const values = {
        ...createJob,
        county:
          createJob?.county && [].concat(createJob?.county).flat(Infinity),
        zipCode: [].concat(createJob?.zipCode).flat(Infinity),
      };
      const statusData = values?.zipCode?.reduce((acc, item) => {
        acc[item] = { zipCode: item, isFinish: false, page: 1 };
        return acc;
      }, {});

      const result = await this.jobService.create(
        { ...values, statusData },
        currentUser,
      );
      await this.scrapingQueue.add('search-business', result, {
        removeOnComplete: true,
        attempts: 10,
        backoff: 1000,
      });

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createReJob(id: string, currentUser: UserEntity) {
    try {
      const result = await this.jobService.findById(id);
      const zipCodeUnfinished = result?.zipCodeScratch?.filter(
        (i: any) => !i?.isFinish,
      );
      const dataQueue = { zipCodeUnfinished, currentUser };
      await this.scrapingQueue.add('re-processing-scratch', dataQueue, {
        removeOnComplete: true,
        attempts: 10,
        backoff: 2000,
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
        return job;
      });
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
