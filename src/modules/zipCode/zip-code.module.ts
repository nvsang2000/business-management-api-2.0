import { ZipCodeController } from './zip-code.controller';
import { ZipCodeService } from './zip-code.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  controllers: [ZipCodeController],
  providers: [ZipCodeService],
  exports: [ZipCodeService],
})
export class ZipCodeModule {}
