import { StringFieldOptional } from 'src/decorators';
import { FetchDto } from 'src/dto/fetch.dto';

export class FetchVerifyDto extends FetchDto {
  @StringFieldOptional({ each: true })
  categories?: string[];

  @StringFieldOptional({ each: true })
  zipCode?: string[];

  @StringFieldOptional({ each: true })
  state?: string[];

  @StringFieldOptional({ each: true })
  city?: string[];
}
