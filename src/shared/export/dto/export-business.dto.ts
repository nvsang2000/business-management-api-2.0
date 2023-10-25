import { EnumField, StringFieldOptional } from 'src/decorators';
import { FetchBusinessDto } from '../../../modules/business/dto/fetch-business.dto';
import { EXPORT_MODE } from 'src/constants';
import { ValidateIf } from 'class-validator';

export class ExportBusinessDto extends FetchBusinessDto {
  @EnumField(() => EXPORT_MODE)
  mode: EXPORT_MODE;

  @ValidateIf((options) => Boolean(options.mode === EXPORT_MODE.selected))
  @StringFieldOptional({ each: true })
  ids?: number[];
}
