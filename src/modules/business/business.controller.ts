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
  Sse,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { CreateBusinessDto, FetchBusinessDto, ExportBusinessDto } from './dto';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { Response } from 'express';
import { WebhookService } from 'src/webhook.service';

@ApiTags('Business')
@Controller('business')
@ApiBasicAuth('access-token')
export class BusinessController {
  constructor(
    private businessService: BusinessService,
    private webhookService: WebhookService,
  ) {}

  @Get()
  paginate(
    @Query() fetchDto: FetchBusinessDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    return this.businessService.paginate(fetchDto, res);
  }

  @Get('export')
  getExport(@Query() fetchDto: ExportBusinessDto) {
    return this.businessService.createExport(fetchDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findById(id);
  }

  @Post()
  create(
    @Body() payload: CreateBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.businessService.create(payload, currentUser);
  }

  @Get('/webhooks')
  @Sse('/webhooks')
  async getEvents(): Promise<any> {
    return this.webhookService.getEvents();
  }
  // @Put(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() payload: UpdateBusinessDto,
  //   @CurrentUser() currentUser: UserEntity,
  // ) {
  //   return this.businessService.update(id, payload, currentUser);
  // }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.businessService.delete(id);
  }
}
