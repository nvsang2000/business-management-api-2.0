import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { BusinessModule } from '../business/business.module';
import { BullModule } from '@nestjs/bull';
import { JobService } from './job.service';
import { SearchBusinessService } from './service/search-business.service';
import { BullJobQueue } from './bull/job-queue.bull';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { AutoSearchBusinessService } from './service/auto-search-business.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'job-queue' }), BusinessModule],
  controllers: [JobController],
  providers: [
    JobService,
    BullJobQueue,
    SearchBusinessService,
    ZipCodeService,
    AutoSearchBusinessService,
  ],
  exports: [JobService],
})
export class JobModule {}
