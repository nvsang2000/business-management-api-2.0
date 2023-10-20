import { ImportService } from './import.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
