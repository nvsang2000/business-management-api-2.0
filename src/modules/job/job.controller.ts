/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Controller,
  Get,
  Res,
  Query,
  Param,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { FetchDto } from '../../dto/fetch.dto';
import { JobAutoDto, CreateJobSearchBusinessDto } from './dto';
import { CurrentUser, Roles } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { Response } from 'express';
import { JobService } from './job.service';
import { SearchService } from './service/search.service';
import { AutoSearchService } from './service/auto-search.service';
import { ROLE } from 'src/constants';
import { AutoVerifyService } from './service/auto-verify.service';

@ApiTags('Job Data')
@Controller('job')
@ApiBasicAuth('access-token')
export class JobController {
  constructor(
    private jobService: JobService,
    private searchService: SearchService,
    private autoVerifyService: AutoVerifyService,
    private autoSearchService: AutoSearchService,
  ) {}

  @Post('search')
  createJobSearch(
    @Body() payload: CreateJobSearchBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.searchService.createJobSearch(payload, currentUser);
  }

  @Get('auto-search')
  @Roles([ROLE.admin])
  createJobAutoSearch(
    @Query() payload: JobAutoDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.autoSearchService.createJobAutoSearch(payload, currentUser);
  }

  @Get('re-auto-search/:id')
  @Roles([ROLE.admin])
  createJobReAutoSearch(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.autoSearchService.reJobAutoSearch(id, currentUser);
  }

  @Get('auto-verify')
  @Roles([ROLE.admin])
  getVerify(
    @Query() payload: JobAutoDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.autoVerifyService.createJobAutoVerify(payload, currentUser);
  }

  @Get('re-auto-verify/:id')
  @Roles([ROLE.admin])
  createJobReAutoVerify(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.autoVerifyService.reJobAutoVerify(id, currentUser);
  }

  @Get()
  paginate(
    @Query() fetchDto: FetchDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    return this.jobService.paginate(fetchDto, res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobService.findOne(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.jobService.delete(id);
  }
}
