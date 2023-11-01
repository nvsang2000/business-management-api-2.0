import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ImportService } from '../import.service';
import { UnprocessableEntityException } from '@nestjs/common';

@Processor(`import-queue-${process.env.REDIS_SERVER}`)
export class BullImportQueue {
  constructor(private importSerivce: ImportService) {}

  @Process('import-business')
  async importBusiness(bull: Job<any>) {
    try {
      console.log('job id: ', bull?.id);
      return await this.importSerivce.runImportBusiness(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
