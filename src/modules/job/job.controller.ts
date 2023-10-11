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
import { CreateJobAutoDto, CreateJobSearchBusinessDto } from './dto';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { Response } from 'express';
import { JobService } from './job.service';
import { SearchBusinessService } from './service/search-business.service';
import { GoogleService } from './service/google.service';
import { LimitVerifyDto } from './dto/limit-verify.dto';
import { AutoSearchBusinessService } from './service/auto-search-business.service';

@ApiTags('Job Data')
@Controller('job')
@ApiBasicAuth('access-token')
export class JobController {
  constructor(
    private jobService: JobService,
    private googleService: GoogleService,
    private searchBusinessService: SearchBusinessService,
    private autoSearchBusinessService: AutoSearchBusinessService,
  ) {}

  @Post('search-business')
  createJobSearch(
    @Body() payload: CreateJobSearchBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.searchBusinessService.createJobSearch(payload, currentUser);
  }

  @Post('auto-search-business')
  createJobAutoSearch(
    @Body() payload: CreateJobAutoDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.autoSearchBusinessService.createJobAutoSearch(
      payload,
      currentUser,
    );
  }

  @Get('re-auto-search-business/:id')
  createJobReAutoSearch(
    @Param('id') id: string,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.autoSearchBusinessService.reJobAutoSearch(id, currentUser);
  }

  @Get('verify-google')
  getVerifyGoogle(
    @Query() fetchDto: LimitVerifyDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.googleService.createJob(fetchDto, currentUser);
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
