import { StringField } from 'src/decorators';
export class CreateCategoryDto {
  @StringField({})
  name: string;

  @StringField({})
  slug: string;
}
