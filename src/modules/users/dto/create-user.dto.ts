import { ROLE } from 'src/constants';
import {
  BooleanFieldOptional,
  EnumField,
  StringFieldOptional,
} from 'src/decorators';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

export class CreateUserDto extends RegisterDto {
  @EnumField(() => ROLE, { swaggerOptions: { example: 'admin' } })
  role?: ROLE;

  @StringFieldOptional({})
  policyId?: string;

  @BooleanFieldOptional({})
  isActive?: boolean;
}
