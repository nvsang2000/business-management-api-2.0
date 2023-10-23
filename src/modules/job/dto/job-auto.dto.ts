import { SOURCE_SCRATCH } from 'src/constants';
import { EnumField, StringField } from 'src/decorators';

export class JobAutoDto {
  @StringField({ swaggerOptions: { example: 'Vietnamese Restaurants' } })
  keyword: string;

  @EnumField(() => SOURCE_SCRATCH)
  source: string;
}
