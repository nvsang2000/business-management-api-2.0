import { ApiProperty } from '@nestjs/swagger';
import { FILE_TYPE } from 'src/constants';

export class FileEntity {
  @ApiProperty({ type: String })
  id?: string;

  @ApiProperty({ type: String, required: false })
  creatorId?: string;

  @ApiProperty({ type: String })
  name?: string;

  @ApiProperty({ type: String, enum: FILE_TYPE })
  type?: FILE_TYPE;

  @ApiProperty({ type: String })
  url?: string;

  constructor(partial: Partial<FileEntity>) {
    Object.assign(this, partial);
  }
}
