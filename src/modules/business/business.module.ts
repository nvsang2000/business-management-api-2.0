import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { BullModule } from '@nestjs/bull';
import { ExportModule } from 'src/shared/export/export.module';
import { FilesModule } from '../files/files.module';
import { ImportModule } from 'src/shared/import/import.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'job-export-business' }),
    ExportModule,
    ImportModule,
    FilesModule,
  ],
  controllers: [BusinessController],
  providers: [BusinessService, ZipCodeService],
  exports: [BusinessService],
})
export class BusinessModule {}
