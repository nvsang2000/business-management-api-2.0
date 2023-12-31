import {
  NumberFieldOptional,
  StringField,
  StringFieldOptional,
} from 'src/decorators';

export class CreateScratchBusinessDto {
  @StringField({})
  name: string;

  @StringField({})
  phone?: string;

  @StringFieldOptional({ url: true })
  website?: string;

  @StringFieldOptional({})
  address: string;

  @StringFieldOptional({})
  zipCode?: string;

  @StringFieldOptional({})
  state?: string;

  @StringFieldOptional({})
  city?: string;

  @StringFieldOptional({})
  thumbnailUrl?: string;

  @StringFieldOptional({})
  email?: string;

  @NumberFieldOptional({})
  statusWebsite?: number;

  @StringFieldOptional({})
  scratchLink?: string;

  @StringFieldOptional({})
  source?: string;

  @StringFieldOptional({})
  keyword: string;

  @StringFieldOptional({})
  categories?: string[];
}
