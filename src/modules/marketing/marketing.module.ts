import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
