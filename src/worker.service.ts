/*
https://docs.nestjs.com/providers#services
*/

import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { PrismaService } from 'nestjs-prisma';
import { JOB_STATUS, TYPE_JOB } from './constants';

@Injectable()
export class WorkerService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('job-queue') private readonly scrapingQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.processWaitingJob();
  }

  async processWaitingJob() {
    const job = await this.prisma.job.findFirst({
      where: { status: JOB_STATUS.WAITING },
      orderBy: { createdAt: 'asc' },
    });
    if (job) {
      console.log('Job', job);
      const nameJob =
        job.type === TYPE_JOB.AUTO
          ? 'auto-search-business-24h'
          : 'search-business';
      await this.scrapingQueue.add(
        nameJob,
        { jobId: job?.id, userId: job?.creatorId },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 0,
        },
      );
    }
  }
}
