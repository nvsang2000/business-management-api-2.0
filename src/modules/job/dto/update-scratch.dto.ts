import { EnumFieldOptional, NumberFieldOptional } from 'src/decorators';
import { CreateJobSearchBusinessDto } from './create-job-search-business.dto';
import { JOB_STATUS } from 'src/constants';

export class UpdateScratchDto extends CreateJobSearchBusinessDto {
  @EnumFieldOptional(() => JOB_STATUS, {
    swaggerOptions: { example: JOB_STATUS.WAITING },
  })
  status?: JOB_STATUS;

  @NumberFieldOptional({})
  duration?: number;
}
