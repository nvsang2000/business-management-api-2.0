import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { ExportService } from '../export.service';

@Processor(`export-queue-${process.env.REDIS_SERVER}`)
export class BullImportQueue {
  constructor(private exportService: ExportService) {}

  @Process('export-business')
  async importBusiness(bull: Job<any>) {
    try {
      console.log('bull', bull.data);
      return await this.exportService.runExportBusiness(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
