import { ApiProperty } from '@nestjs/swagger';

export class BusinessEntity {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  phone?: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  website?: string;

  @ApiProperty()
  scratchLink?: string;

  @ApiProperty()
  source?: string;

  @ApiProperty()
  addressZipCode?: string;

  @ApiProperty()
  state?: string;

  @ApiProperty()
  zipCode?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  status?: string[];

  @ApiProperty()
  categories?: string[];

  @ApiProperty()
  thumbnailUrl?: string;

  @ApiProperty()
  googleVerify?: boolean;

  @ApiProperty()
  keyword?: string;

  @ApiProperty()
  googleMapId?: string;

  @ApiProperty()
  cityId?: string;

  @ApiProperty()
  category?: any;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}
