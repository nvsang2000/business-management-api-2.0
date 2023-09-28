import {
  ArrayFieldOptional,
  BooleanFieldOptional,
  StringField,
  StringFieldOptional,
} from 'src/decorators';
export class CreateBusinessDto {
  @StringField({})
  name: string;

  @StringField({})
  phone: string;

  @StringFieldOptional({})
  website?: string;

  @StringFieldOptional({})
  address: string;

  @BooleanFieldOptional({})
  isActive?: boolean;

  @ArrayFieldOptional({})
  categories?: string[];

  @StringFieldOptional({})
  thumbnailUrl?: string;
}
