/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { FilesModule } from 'src/modules/files/files.module';
import { BullImportQueue } from './bull/export-queue';
import { BusinessService } from 'src/modules/business/business.service';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { BullModule } from '@nestjs/bull';
import { ExportController } from './export.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: `export-queue-${process.env.REDIS_SERVER}`,
    }),
    FilesModule,
  ],
  controllers: [ExportController],
  providers: [ExportService, BullImportQueue, BusinessService, ZipCodeService],
  exports: [ExportService],
})
export class ExportModule {}
