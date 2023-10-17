import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { UUID } from 'crypto';

export class FetchUuidDto {
  @IsUUID()
  @ApiProperty({ required: true })
  @IsOptional()
  id?: UUID;
}
