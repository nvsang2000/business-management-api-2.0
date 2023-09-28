import { ApiProperty } from '@nestjs/swagger';

export class ScratchEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  isActive?: boolean;

  @ApiProperty()
  term: string;

  @ApiProperty()
  addressState: string;

  @ApiProperty()
  addressCountry: string;

  @ApiProperty()
  addressZipCode: string;

  @ApiProperty()
  zipCodeScratchIds: string;

  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  updatedById?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<ScratchEntity>) {
    Object.assign(this, partial);
  }
}
