import { ExportService } from 'src/shared/export/export.service';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  controllers: [BusinessController],
  providers: [BusinessService, ExportService],
  exports: [BusinessService],
})
export class BusinessModule {}
