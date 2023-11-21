import { CATEGORY_SORT_BY, SORT_DIRECTION } from 'src/constants';
import {
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from 'src/decorators';
export class FetchDto {
  @StringFieldOptional({})
  search?: string = '';

  @NumberFieldOptional({})
  page?: number = 1;

  @NumberFieldOptional({ maximum: 500, minimum: 10 })
  limit?: number = 10;

  @EnumFieldOptional(() => CATEGORY_SORT_BY)
  sortBy?: string = 'createdAt';

  @EnumFieldOptional(() => SORT_DIRECTION, {})
  sortDirection?: string = 'desc';
}
