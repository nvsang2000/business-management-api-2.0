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
    @InjectQueue(`job-queue-${process.env.REDIS_SERVER}`)
    private readonly scrapingQueue: Queue,
  ) {}

  // async onModuleInit() {
  //   await this.processWaitingJob();
  // }

  async processWaitingJob() {
    const job = await this.prisma.job.findFirst({
      where: { status: JOB_STATUS.WAITING },
      orderBy: { createdAt: 'asc' },
    });
    if (job?.type === TYPE_JOB.NORMAL) {
      console.log('Job', job.id);
      await this.scrapingQueue.add(
        'search-business',
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
