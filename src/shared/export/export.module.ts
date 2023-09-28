import { ExportService } from './export.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
