import { ExportService } from 'src/export.service';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { BullModule } from '@nestjs/bull';
import { ExportBusinessService } from './export-business.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'job-export-business' })],
  controllers: [BusinessController],
  providers: [
    BusinessService,
    ExportService,
    ZipCodeService,
    ExportBusinessService,
  ],
  exports: [BusinessService],
})
export class BusinessModule {}
