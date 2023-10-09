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
import { CreateJobSearchBusinessDto } from './dto';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { Response } from 'express';
import { JobService } from './job.service';
import { SearchBusinessService } from './service/search-business.service';
import { GoogleService } from './service/google.service';
import { LimitVerifyDto } from './dto/limit-verify.dto';

@ApiTags('Job Data')
@Controller('job')
@ApiBasicAuth('access-token')
export class JobController {
  constructor(
    private jobService: JobService,
    private searchBusinessService: SearchBusinessService,
    private googleService: GoogleService,
  ) {}

  @Post('search-business')
  createJob(
    @Body() payload: CreateJobSearchBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.searchBusinessService.createJob(payload, currentUser);
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
