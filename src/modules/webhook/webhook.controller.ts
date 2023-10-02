import { Controller, Get, Sse } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('webhooks')
@ApiBasicAuth('access-token')
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Get('/')
  @Sse('/')
  async getEvents(): Promise<any> {
    return this.webhookService.getEvents();
  }
}
