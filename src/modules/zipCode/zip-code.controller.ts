/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Query } from '@nestjs/common';
import { ZipCodeService } from './zip-code.service';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { FetchZipCodeDto } from './dto/fetch-zip-code.dto';

@ApiTags('Zip Code ')
@Controller('zipCode')
@ApiBasicAuth('access-token')
@Controller()
export class ZipCodeController {
  constructor(private zipCodeService: ZipCodeService) {}

  @Get('tree')
  getJson(@Query() fetchDto: FetchZipCodeDto) {
    return this.zipCodeService.readFileZipCode(fetchDto);
  }

  @Get('cover-tree')
  coverZipCodeJson() {
    return this.zipCodeService.coverZipCodeTree();
  }

  @Get('create-city')
  createCity() {
    return this.zipCodeService.createCity();
  }

  @Get('cover-city')
  cover() {
    return this.zipCodeService.coverZipCodeCity();
  }
}
