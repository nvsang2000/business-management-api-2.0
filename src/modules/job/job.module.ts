import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { BusinessModule } from '../business/business.module';
import { BullModule } from '@nestjs/bull';
import { JobService } from './job.service';
import { SearchService } from './service/search.service';
import { BullJobQueue } from './bull/job-queue.bull';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { AutoSearchService } from './service/auto-search.service';
import { AutoVerifyService } from './service/auto-verify.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'job-queue' }), BusinessModule],
  controllers: [JobController],
  providers: [
    JobService,
    BullJobQueue,
    SearchService,
    ZipCodeService,
    AutoSearchService,
    AutoVerifyService,
  ],
  exports: [JobService],
})
export class JobModule {}
