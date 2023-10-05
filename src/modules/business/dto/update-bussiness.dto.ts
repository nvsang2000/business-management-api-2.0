import { EnumFieldOptional, StringFieldOptional } from 'src/decorators';
import { CreateBusinessDto } from './create-business.dto';
import { STATUS_MARKETING } from 'src/constants';

export class UpdateBusinessDto extends CreateBusinessDto {
  @StringFieldOptional({ each: true })
  status?: string[];

  @EnumFieldOptional(() => STATUS_MARKETING)
  statusMarketing?: STATUS_MARKETING;
}
