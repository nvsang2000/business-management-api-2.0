/*
https://docs.nestjs.com/providers#services
*/

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class WorkerService {
  constructor(@InjectQueue('job-queue') private readonly queue: Queue) {}

  async onModuleInit() {
    await this.processUnfinishedJobs();
  }

  async processUnfinishedJobs() {
    const jobs = await this.queue.getActive();
    console.log('Jobs', jobs);
    for (const job of jobs) {
      await this.queue.add(job.name, job.data);
    }
  }
}
