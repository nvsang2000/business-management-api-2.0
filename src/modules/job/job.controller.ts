/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Controller,
  Get,
  Res,
  Query,
  Param,
  Sse,
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
import { WebhooksService } from './service/webhooks.service';
import { JobService } from './job.service';
import { BullService } from './service/bull.service';

@ApiTags('Job Data')
@Controller('job')
@ApiBasicAuth('access-token')
export class JobController {
  constructor(
    private jobService: JobService,
    private bullService: BullService,
    private webhooksService: WebhooksService,
  ) {}

  @Post('search-business')
  async createJob(
    @Body() payload: CreateJobSearchBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.bullService.createJob(payload, currentUser);
  }

  @Get('job-list')
  async getJobList() {
    return this.bullService.getJobList();
  }

  @Get('/webhooks')
  @Sse('/webhooks')
  async getEvents(): Promise<any> {
    return this.webhooksService.getEvents();
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
