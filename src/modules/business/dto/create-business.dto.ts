import {
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
  email?: string;

  @StringField({})
  address: string;

  @StringField({})
  city: string;

  @StringField({})
  zipCode: string;

  @StringField({})
  state: string;

  @StringFieldOptional({ each: true })
  status?: string[];

  @BooleanFieldOptional({})
  isActive?: boolean;

  @StringField({ each: true })
  categories?: string[];

  @StringFieldOptional({})
  thumbnailUrl?: string;
}
