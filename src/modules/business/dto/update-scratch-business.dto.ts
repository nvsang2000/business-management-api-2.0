import {
  BooleanFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from 'src/decorators';

export class UpdateScratchBusinessDto {
  @StringFieldOptional({})
  name: string;

  @StringFieldOptional({})
  phone?: string;

  @StringFieldOptional({ url: true })
  website?: string;

  @StringFieldOptional({})
  email?: string;

  @NumberFieldOptional({})
  statusWebsite?: number;

  @StringFieldOptional({})
  address?: string;

  @StringFieldOptional({})
  zipCode?: string;

  @StringFieldOptional({})
  state?: string;

  @StringFieldOptional({})
  city?: string;

  @StringFieldOptional({})
  thumbnailUrl?: string;

  @BooleanFieldOptional({})
  googleVerify?: boolean;

  @StringFieldOptional({})
  scratchLink?: string;

  @StringFieldOptional({})
  categories?: string[];
}
