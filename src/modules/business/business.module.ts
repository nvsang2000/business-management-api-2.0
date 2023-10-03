import { ExportService } from 'src/shared/export/export.service';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [BullModule.registerQueue({ name: 'job-export-business' })],
  controllers: [BusinessController],
  providers: [BusinessService, ExportService, ZipCodeService],
  exports: [BusinessService],
})
export class BusinessModule {}
