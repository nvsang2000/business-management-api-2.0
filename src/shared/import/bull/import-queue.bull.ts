import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ImportService } from '../import.service';
import { UnprocessableEntityException } from '@nestjs/common';

@Processor('import-queue')
export class BullImportQueue {
  constructor(private importSerivce: ImportService) {}

  @Process('import-business')
  async importBusiness(bull: Job<any>) {
    try {
      return await this.importSerivce.runImportBusiness(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
