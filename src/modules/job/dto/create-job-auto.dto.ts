import { StringField } from 'src/decorators';

export class CreateJobAutoDto {
  @StringField({ swaggerOptions: { example: 'Vietnamese Restaurants' } })
  keyword?: string;
}
