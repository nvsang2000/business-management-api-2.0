import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { UUID } from 'crypto';
import {
  GOOOGLE_VERIFY,
  STATUS_MARKETING,
  STRING_BOOLEAN,
} from 'src/constants';
import { EnumFieldOptional, StringFieldOptional } from 'src/decorators';
import { FetchDto } from 'src/dto/fetch.dto';

export class FetchBusinessDto extends FetchDto {
  @EnumFieldOptional(() => STRING_BOOLEAN)
  website?: string;

  @EnumFieldOptional(() => GOOOGLE_VERIFY)
  googleVerify?: string;

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

  @EnumFieldOptional(() => STATUS_MARKETING)
  statusMarketing?: STATUS_MARKETING;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  userMarketingId?: UUID;
}
