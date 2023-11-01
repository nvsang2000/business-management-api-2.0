import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { ExportService } from '../export.service';
import { WebhooksService } from 'src/shared/export/webhooks.service';
import { BullExport } from 'src/interface';

@Processor(`export-queue-${process.env.REDIS_SERVER}`)
export class BullImportQueue {
  constructor(
    private exportService: ExportService,
    private webhooksService: WebhooksService,
  ) {}

  @Process('export-business')
  async importBusiness(bull: Job<BullExport>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.exportService.runExportBusiness(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @OnQueueCompleted()
  async onComplated(bull: Job<BullExport>) {
    return this.webhooksService.sendEvent({ data: bull.returnvalue });
  }
}
