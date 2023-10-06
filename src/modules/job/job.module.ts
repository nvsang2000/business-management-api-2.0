import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { BusinessModule } from '../business/business.module';
import { BullModule } from '@nestjs/bull';
import { JobService } from './job.service';
import { SearchBusinessService } from './service/search-business.service';
import { BullJobQueue } from './bull/job-queue.bull';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'job-queue' }),
    BusinessModule,
    HttpModule,
  ],
  controllers: [JobController],
  providers: [JobService, BullJobQueue, SearchBusinessService, ZipCodeService],
  exports: [JobService],
})
export class JobModule {}
