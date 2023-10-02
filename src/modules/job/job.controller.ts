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

@ApiTags('Job Data')
@Controller('job')
@ApiBasicAuth('access-token')
export class JobController {
  constructor(
    private jobService: JobService,
    private searchBusinessService: SearchBusinessService,
  ) {}

  @Post('search-business')
  async createJob(
    @Body() payload: CreateJobSearchBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.searchBusinessService.createJob(payload, currentUser);
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
    return this.jobService.findById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.jobService.delete(id);
  }
}
