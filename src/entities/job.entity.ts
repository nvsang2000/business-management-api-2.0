import { ApiProperty } from '@nestjs/swagger';

export class JobEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  keyword: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  county: string[];

  @ApiProperty()
  zipCode: string[];

  @ApiProperty()
  status: number;

  @ApiProperty()
  statusData: any;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  updatedById?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<JobEntity>) {
    Object.assign(this, partial);
  }
}
