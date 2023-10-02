import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { BusinessService } from '../business.service';
import { ExportBusinessDto } from '../dto';

@Processor('job-export-business')
export class BullJobExportBuisness {
  constructor(private businessService: BusinessService) {}

  @Process('export-business')
  async runBull(bull: Job<ExportBusinessDto>) {
    try {
      return await this.businessService.runExport(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
