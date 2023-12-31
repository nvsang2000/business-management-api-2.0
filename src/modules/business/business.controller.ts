/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  Query,
  Put,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import {
  CreateBusinessDto,
  FetchBusinessDto,
  UpdateBusinessDto,
  UpdateStatusMarketingBusinessDto,
  VerifyBusinessDto,
} from './dto';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { Response } from 'express';

@ApiTags('Business')
@Controller('business')
@ApiBasicAuth('access-token')
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Post()
  create(
    @Body() payload: CreateBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.businessService.create(payload, currentUser);
  }

  @Get()
  paginate(
    @Query() fetchDto: FetchBusinessDto,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<any> {
    return this.businessService.paginate(fetchDto, res, currentUser);
  }

  @Put('verify/:id')
  updateVerify(
    @Param('id') id: string,
    @Body() payload: VerifyBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.businessService.verify(id, payload, currentUser);
  }

  @Put('status-marketing/:id')
  updateMarketing(
    @Param('id') id: string,
    @Body() payload: UpdateStatusMarketingBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.businessService.updateMarketing(id, payload, currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.businessService.update(id, payload, currentUser);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.businessService.delete(id);
  }
}
