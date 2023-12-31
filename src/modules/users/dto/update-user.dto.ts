import { ROLE } from 'src/constants';
import {
  BooleanFieldOptional,
  EnumFieldOptional,
  NumberFieldOptional,
  StringFieldOptional,
} from 'src/decorators';

export class UpdateUserDto {
  @StringFieldOptional({
    maxLength: 256,
    swaggerOptions: { example: 'Nguyễn Văn Sang' },
  })
  displayName: string;

  @StringFieldOptional({ swaggerOptions: { example: 'admin123' } })
  password: string;

  @EnumFieldOptional(() => ROLE, { swaggerOptions: { example: ROLE.admin } })
  role?: ROLE;

  @NumberFieldOptional({})
  policyId?: number;

  @BooleanFieldOptional({})
  isActive?: boolean;
}
