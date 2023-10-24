import { FILE_TYPE } from 'src/constants';
import { EnumField } from 'src/decorators';

export class TypeImportDto {
  @EnumField(() => FILE_TYPE)
  type: string;
}
