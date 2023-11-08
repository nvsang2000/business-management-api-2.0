import { StringField, StringFieldOptional } from 'src/decorators';
export class CreateCategoryDto {
  @StringField({})
  name: string;

  @StringField({})
  slug: string;

  @StringFieldOptional({ each: true })
  properties?: string[];
}
