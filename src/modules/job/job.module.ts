import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { BusinessModule } from '../business/business.module';
import { BullModule } from '@nestjs/bull';
import { JobService } from './job.service';
import { SearchYellowService } from './service/yellow/search.service';
import { BullJobQueue } from './bull/job-queue.bull';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { AutoSearchYellowService } from './service/yellow/auto.service';
import { AutoSearchYelpService } from './service/yelp/auto.service';
import { SearchYelpService } from './service/yelp/search.service';
import { AutoSearchMenufySerivce } from './service/menufy/auto.service';
import { WebsiteSerivce } from './service/website/website.service';
import { FilesModule } from '../files/files.module';
import { JOB_QUEUE } from 'src/constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: JOB_QUEUE }),
    BusinessModule,
    FilesModule,
  ],
  controllers: [JobController],
  providers: [
    JobService,
    BullJobQueue,
    ZipCodeService,
    SearchYellowService,
    SearchYelpService,
    AutoSearchYellowService,
    AutoSearchYelpService,
    AutoSearchMenufySerivce,
    WebsiteSerivce,
  ],
  exports: [JobService],
})
export class JobModule {}
