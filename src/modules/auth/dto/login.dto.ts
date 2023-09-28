import { StringField } from 'src/decorators';

export class LoginDto {
  @StringField({ swaggerOptions: { example: 'nvsang2670' } })
  username: string;

  @StringField({ swaggerOptions: { example: 'admin123' } })
  password: string;
}
