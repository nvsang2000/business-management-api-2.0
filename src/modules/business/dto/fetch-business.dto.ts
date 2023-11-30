import {
  GOOOGLE_VERIFY,
  MATCH_WEBSITE,
  SOURCE_SCRATCH,
  STATUS_MARKETING,
  STATUS_WEBSITE,
  STRING_BOOLEAN,
} from 'src/constants';
import { EnumFieldOptional, StringFieldOptional } from 'src/decorators';
import { FetchDto } from 'src/dto/fetch.dto';

export class FetchBusinessDto extends FetchDto {
  @EnumFieldOptional(() => SOURCE_SCRATCH)
  source?: string;

  @EnumFieldOptional(() => STRING_BOOLEAN)
  website?: string;

  @EnumFieldOptional(() => STRING_BOOLEAN)
  email?: string;

  @EnumFieldOptional(() => STRING_BOOLEAN)
  thumbnailUrl?: string;

  @EnumFieldOptional(() => STATUS_WEBSITE)
  statusWebsite?: STATUS_WEBSITE;

  @EnumFieldOptional(() => GOOOGLE_VERIFY)
  googleVerify?: string;

  @EnumFieldOptional(() => STATUS_MARKETING)
  statusMarketing?: STATUS_MARKETING;

  @EnumFieldOptional(() => MATCH_WEBSITE)
  matchPhone?: MATCH_WEBSITE;

  @EnumFieldOptional(() => MATCH_WEBSITE)
  matchAddress?: MATCH_WEBSITE;

  @StringFieldOptional({ each: true })
  categories?: string[];

  @StringFieldOptional({})
  zipCode?: string;

  @StringFieldOptional({ each: true })
  state?: string[];

  @StringFieldOptional({})
  city?: string;

  @StringFieldOptional({})
  address?: string;

  @StringFieldOptional({})
  keyword?: string;
}
