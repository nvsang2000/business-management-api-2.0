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
  ExportBusinessDto,
  UpdateBusinessDto,
  UpdateStatusMarketingBusinessDto,
} from './dto';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { Response } from 'express';
import { ExportBusinessService } from './export-business.service';

@ApiTags('Business')
@Controller('business')
@ApiBasicAuth('access-token')
export class BusinessController {
  constructor(
    private businessService: BusinessService,
    private exportBusinessService: ExportBusinessService,
  ) {}

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
  ): Promise<any> {
    return this.businessService.paginate(fetchDto, res);
  }

  @Get('export')
  getExport(
    @Query() fetchDto: ExportBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.exportBusinessService.createExport(fetchDto, currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findById(id);
  }

  @Put('status-marketing/:id')
  updateMarketing(
    @Param('id') id: string,
    @Body() payload: UpdateStatusMarketingBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.businessService.updateMarketing(id, payload, currentUser);
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
