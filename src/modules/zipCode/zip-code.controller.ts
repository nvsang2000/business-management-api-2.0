/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Query } from '@nestjs/common';
import { ZipCodeService } from './zip-code.service';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { FetchZipCodeDto } from './dto/fetch-zip-code.dto';
import { Roles } from 'src/decorators';
import { ROLE } from 'src/constants';

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
  @Roles([ROLE.admin])
  coverZipCodeJson() {
    return this.zipCodeService.coverZipCodeTree();
  }

  @Get('cover-city')
  @Roles([ROLE.admin])
  cover() {
    return this.zipCodeService.coverZipCodeCity();
  }
}
