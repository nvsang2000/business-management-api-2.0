import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { UUID } from 'crypto';
import { STATUS_MARKETING } from 'src/constants';
import { EnumFieldOptional, StringFieldOptional } from 'src/decorators';
import { FetchDto } from 'src/dto/fetch.dto';

export class FetchBusinessDto extends FetchDto {
  @StringFieldOptional({ each: true })
  categories?: string[];

  @StringFieldOptional({ each: true })
  zipCode?: string[];

  @StringFieldOptional({ each: true })
  state?: string[];

  @StringFieldOptional({ each: true })
  city?: string[];

  @EnumFieldOptional(() => STATUS_MARKETING)
  statusMarketing?: STATUS_MARKETING;

  @IsUUID()
  @ApiProperty({ required: false })
  @IsOptional()
  userMarketingId?: UUID;
}
