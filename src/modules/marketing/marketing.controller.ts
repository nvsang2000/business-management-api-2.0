/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Marketing')
@Controller('marketing')
@ApiBasicAuth('access-token')
export class MarketingController {}
