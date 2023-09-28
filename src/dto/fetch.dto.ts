import { CATEGORY_SORT_BY, SORT_DIRECTION } from 'src/constants';
import { EnumFieldOptional, StringFieldOptional } from 'src/decorators';
export class FetchDto {
  @StringFieldOptional({})
  search?: string = '';

  @StringFieldOptional({ number: true })
  page?: string = '1';

  @StringFieldOptional({ number: true })
  limit?: string = '10';

  @StringFieldOptional({ bool: true })
  isActive?: string;

  @EnumFieldOptional(() => CATEGORY_SORT_BY)
  sortBy?: string = 'createdAt';

  @EnumFieldOptional(() => SORT_DIRECTION, {})
  sortDirection?: string = 'desc';
}
