import { ApiProperty } from '@nestjs/swagger';

export class PolicyEntity {
  @ApiProperty({ type: Number })
  id: number;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Boolean })
  isActive?: boolean;

  @ApiProperty({ type: [] })
  permissions?: any;

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;

  constructor(partial: Partial<PolicyEntity>) {
    Object.assign(this, partial);
  }
}
