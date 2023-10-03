import { ROLE } from 'src/constants';
import {
  BooleanFieldOptional,
  EnumField,
  NumberFieldOptional,
} from 'src/decorators';
import { RegisterDto } from 'src/modules/auth/dto/register.dto';

export class CreateUserDto extends RegisterDto {
  @EnumField(() => ROLE, { swaggerOptions: { example: 'admin' } })
  role?: ROLE;

  @NumberFieldOptional({})
  policyId?: number;

  @BooleanFieldOptional({})
  isActive?: boolean;
}
