import { ApiProperty } from '@nestjs/swagger';

export class BusinessEntity {
  @ApiProperty()
  id?: string;

  @ApiProperty()
  displayName?: string;

  @ApiProperty()
  anotherName?: string;

  @ApiProperty()
  phoneNumber?: string;

  @ApiProperty()
  website?: string;

  @ApiProperty()
  address?: string;

  @ApiProperty()
  scratchLink?: string;

  @ApiProperty()
  isNew?: boolean;

  @ApiProperty()
  isActive?: boolean;

  @ApiProperty()
  isAcceptMail?: boolean;

  @ApiProperty()
  addressZipCode?: string;

  @ApiProperty()
  addressState?: string;

  @ApiProperty()
  addressCity?: string;

  @ApiProperty()
  isVerify?: any;

  @ApiProperty()
  categories?: string[];

  @ApiProperty()
  thumbnailUrl?: string;

  @ApiProperty()
  createdAt?: Date;

  @ApiProperty()
  updatedAt?: Date;
}
