import { StringField } from 'src/decorators';
import { LoginDto } from './login.dto';
import { IsPhoneNumber } from 'class-validator';

export class RegisterDto extends LoginDto {
  @StringField({
    maxLength: 256,
    swaggerOptions: { example: 'Nguyễn Văn Sang' },
  })
  displayName: string;

  @StringField({
    maxLength: 256,
    email: true,
    swaggerOptions: { example: 'nvsang2670@gmail.com' },
  })
  email: string;

  @IsPhoneNumber()
  @StringField({ swaggerOptions: { example: '0386237067' } })
  phone: string;
}
