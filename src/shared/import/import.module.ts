import { BullModule } from '@nestjs/bull';
import { ImportService } from './import.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { BullImportQueue } from './bull/import-queue.bull';
import { FilesModule } from 'src/modules/files/files.module';
import { ImportController } from './import.controller';
import { BusinessService } from 'src/modules/business/business.service';
import { ZipCodeService } from 'src/modules/zipCode/zip-code.service';
import { JOB_IMPORT } from 'src/constants';
@Module({
  imports: [BullModule.registerQueue({ name: JOB_IMPORT }), FilesModule],
  controllers: [ImportController],
  providers: [ImportService, BullImportQueue, BusinessService, ZipCodeService],
  exports: [ImportService],
})
export class ImportModule {}
