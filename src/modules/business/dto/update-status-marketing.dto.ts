import { STATUS_MARKETING } from 'src/constants';
import { EnumField } from 'src/decorators';

export class UpdateStatusMarketingBusinessDto {
  @EnumField(() => STATUS_MARKETING)
  statusMarketing?: STATUS_MARKETING;
}
