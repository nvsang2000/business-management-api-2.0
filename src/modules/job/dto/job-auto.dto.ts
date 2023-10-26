import { StringField } from 'src/decorators';
import { SourceScratchDto } from './source.dto';

export class JobAutoDto extends SourceScratchDto {
  @StringField({ swaggerOptions: { example: 'Vietnamese Restaurants' } })
  keyword: string;
}
