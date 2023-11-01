import { StringField, StringFieldOptional } from 'src/decorators';
export class CreateFileDto {
  @StringField({})
  name: string;

  @StringField({})
  type: string;

  @StringField({})
  url: string;

  @StringFieldOptional({})
  dirFile?: string;
}
