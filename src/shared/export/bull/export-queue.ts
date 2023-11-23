import { OnQueueCompleted, Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { ExportService } from '../export.service';
import { WebhooksService } from 'src/shared/export/webhooks.service';
import { BullExport } from 'src/interface';
import { JOB_EXPORT, JOB_EXPORT_CHILD } from 'src/constants';

@Processor(JOB_EXPORT)
export class BullExportQueue {
  constructor(
    private exportService: ExportService,
    private webhooksService: WebhooksService,
  ) {}

  @Process(JOB_EXPORT_CHILD.EXPORT_BUSINESS)
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
    console.log('result: ', bull?.returnvalue);
    return this.webhooksService.sendEvent({ data: bull?.returnvalue });
  }
}
