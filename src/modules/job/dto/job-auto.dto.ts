import { StringField } from 'src/decorators';

export class JobAutoDto {
  @StringField({ swaggerOptions: { example: 'Vietnamese Restaurants' } })
  keyword?: string;
}
