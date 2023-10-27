/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Query, Sse } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { ExportService } from './export.service';
import { ExportBusinessDto } from './dto/export-business.dto';
import { WebhooksService } from 'src/shared/export/webhooks.service';

@ApiTags('Export')
@Controller('export')
@ApiBasicAuth('access-token')
export class ExportController {
  constructor(
    private exportService: ExportService,
    private webhooksService: WebhooksService,
  ) {}

  @Get('business')
  getExport(
    @Query() fetchDto: ExportBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.exportService.createExport(fetchDto, currentUser);
  }

  @Get('webhooks')
  @Sse('webhooks')
  getStatusDelivery() {
    return this.webhooksService.getEvents();
  }
}
