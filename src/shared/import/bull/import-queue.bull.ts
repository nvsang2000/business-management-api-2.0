import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ImportService } from '../import.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { JOB_IMPORT, JOB_IMPORT_CHILD } from 'src/constants';

@Processor(JOB_IMPORT)
export class BullImportQueue {
  constructor(private importSerivce: ImportService) {}

  @Process(JOB_IMPORT_CHILD.IMPORT_BUSINESS)
  async importBusiness(bull: Job<any>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.importSerivce.runImportBusiness(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
