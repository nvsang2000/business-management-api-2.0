/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { FilesModule } from 'src/modules/files/files.module';
import { BullExportQueue } from './bull/export-queue';
import { BusinessService } from 'src/modules/business/business.service';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { BullModule } from '@nestjs/bull';
import { ExportController } from './export.controller';
import { WebhooksService } from 'src/shared/export/webhooks.service';
import { JOB_EXPORT } from 'src/constants';

@Module({
  imports: [BullModule.registerQueue({ name: JOB_EXPORT }), FilesModule],
  controllers: [ExportController],
  providers: [
    ExportService,
    BullExportQueue,
    BusinessService,
    ZipCodeService,
    WebhooksService,
  ],
  exports: [ExportService],
})
export class ExportModule {}
