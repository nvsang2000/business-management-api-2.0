import { BooleanFieldOptional } from 'src/decorators';
import { FetchBusinessDto } from './fetch-business.dto';

export class ExportBusinessDto extends FetchBusinessDto {
  @BooleanFieldOptional({})
  isFindAll?: boolean;
}
