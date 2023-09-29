import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { BusinessModule } from '../business/business.module';
import { BullModule } from '@nestjs/bull';
import { WebhooksService } from './service/webhooks.service';
import { CategoryService } from '../category/category.service';
import { JobService } from './job.service';
import { BullService } from './service/bull.service';
import { SearchBusinessService } from './service/search-business.service';
import { BullJobQueue } from './bull/bull-job-queue';

@Module({
  imports: [BullModule.registerQueue({ name: 'job-queue' }), BusinessModule],
  controllers: [JobController],
  providers: [
    JobService,
    BullJobQueue,
    BullService,
    SearchBusinessService,
    CategoryService,
    WebhooksService,
  ],
  exports: [JobService, BullService],
})
export class JobModule {}
