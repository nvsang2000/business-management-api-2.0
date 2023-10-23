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
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { FetchDto } from '../../dto/fetch.dto';
import { JobAutoDto, CreateJobSearchBusinessDto } from './dto';
import { CurrentUser, Roles } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { Response } from 'express';
import { JobService } from './job.service';
import { SearchYellowService } from './service/yellow/search.service';
import { ROLE, SOURCE_SCRATCH } from 'src/constants';
import { AutoSearchYelpService } from './service/yelp/auto.service';
import { AutoSearchYellowService } from './service/yellow/auto.service';
import { SearchYelpService } from './service/yelp/search.service';

@ApiTags('Job Data')
@Controller('job')
@ApiBasicAuth('access-token')
export class JobController {
  constructor(
    private jobService: JobService,
    private searchYelp: SearchYelpService,
    private searchYellow: SearchYellowService,
    private autoSearchYelp: AutoSearchYelpService,
    private autoSearchYellow: AutoSearchYellowService,
  ) {}

  @Post('search/:source')
  createJobSearch(
    @Param('source') source: SOURCE_SCRATCH,
    @Body() payload: CreateJobSearchBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    if (source === SOURCE_SCRATCH.YELLOW_PAGES)
      return this.searchYellow.createJobSearch(payload, currentUser);

    if (source === SOURCE_SCRATCH.YELP)
      return this.searchYelp.createJobSearch(payload, currentUser);

    throw new UnprocessableEntityException();
  }

  @Get('search/:id')
  createReJobSearch(
    @Param('id') id: string,
    @Query() payload: JobAutoDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    if (payload?.source === SOURCE_SCRATCH.YELLOW_PAGES)
      return this.searchYellow.reJobSearch(id, currentUser);

    if (payload?.source === SOURCE_SCRATCH.YELP)
      return this.searchYelp.reJobSearch(id, currentUser);
  }

  @Get('auto-search')
  @Roles([ROLE.admin])
  createJobAutoSearch(
    @Query() payload: JobAutoDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    if (payload?.source === SOURCE_SCRATCH.YELLOW_PAGES)
      return this.autoSearchYellow.createJobAuto(payload, currentUser);

    if (payload?.source === SOURCE_SCRATCH.YELP)
      return this.autoSearchYelp.createJobAuto(payload, currentUser);
  }

  @Get('re-auto-search/:id')
  @Roles([ROLE.admin])
  createJobReAutoSearch(
    @Param('id') id: string,
    @Query() payload: JobAutoDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    if (payload?.source === SOURCE_SCRATCH.YELLOW_PAGES)
      return this.autoSearchYellow.reJobAuto(id, currentUser);

    if (payload?.source === SOURCE_SCRATCH.YELP)
      return this.autoSearchYelp.reJobAuto(id, currentUser);
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
