import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { ExportModule } from 'src/shared/export/export.module';
import { FilesModule } from '../files/files.module';
import { ImportModule } from 'src/shared/import/import.module';

@Module({
  imports: [ExportModule, ImportModule, FilesModule],
  controllers: [BusinessController],
  providers: [BusinessService, ZipCodeService],
  exports: [BusinessService],
})
export class BusinessModule {}
