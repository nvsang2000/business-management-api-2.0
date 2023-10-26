import { SOURCE_SCRATCH } from 'src/constants';
import { EnumField } from 'src/decorators';

export class SourceScratchDto {
  @EnumField(() => SOURCE_SCRATCH)
  source: string;
}
