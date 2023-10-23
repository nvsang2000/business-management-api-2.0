import { StringField, StringFieldOptional } from 'src/decorators';

export class CreateJobSearchBusinessDto {
  @StringField({ swaggerOptions: { example: 'Restaurant' } })
  keyword?: string;

  @StringFieldOptional({ swaggerOptions: { example: 'CA' } })
  state?: string;

  @StringFieldOptional({ each: true, swaggerOptions: { example: ['Alameda'] } })
  county?: string[];

  @StringField({ each: true, swaggerOptions: { example: ['94601'] } })
  zipCode?: string[];
}
