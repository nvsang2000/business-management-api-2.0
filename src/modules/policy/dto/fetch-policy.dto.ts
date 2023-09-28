import { ApiProperty, PartialType } from '@nestjs/swagger';
import { StringFieldOptional } from 'src/decorators';
import { FetchDto } from 'src/dto/fetch.dto';

export class FetchPolicyDto extends PartialType(FetchDto) {
  @ApiProperty({ type: Boolean, required: false })
  @StringFieldOptional({ bool: true })
  isActive?: string;
}
