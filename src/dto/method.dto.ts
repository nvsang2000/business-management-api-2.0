import { METHOD } from 'src/constants';
import { EnumField } from 'src/decorators';

export class MethodDto {
  @EnumField(() => METHOD, {
    swaggerOptions: { example: METHOD.GET },
  })
  method?: METHOD;
}
