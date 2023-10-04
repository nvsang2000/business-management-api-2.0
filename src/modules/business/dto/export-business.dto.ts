import { NumberFieldOptional } from 'src/decorators';
import { FetchBusinessDto } from './fetch-business.dto';

export class ExportBusinessDto extends FetchBusinessDto {
  @NumberFieldOptional({ each: true })
  isAll?: number = 0;
}
