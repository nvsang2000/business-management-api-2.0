import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UnprocessableEntityException } from '@nestjs/common';
import { SearchBusinessService } from '../service/search-business.service';
import { BullGoogleVerifyBasic, BullJob } from 'src/interface';
import { GoogleService } from '../service/google.service';

@Processor('job-queue')
export class BullJobQueue {
  constructor(
    private searchBusiness: SearchBusinessService,
    private googleService: GoogleService,
  ) {}

  @Process('search-business')
  async runBull(bull: Job<BullJob>) {
    try {
      return await this.searchBusiness.runJob(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  @Process('google-verify-basic')
  async runGoogleVerifyBasic(bull: Job<BullGoogleVerifyBasic>) {
    try {
      return await this.googleService.verifyGoogleBasic(bull);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
