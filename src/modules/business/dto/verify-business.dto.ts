import { BUSINESS_STATUS } from 'src/constants';
import { StringFieldOptional } from 'src/decorators';

export class VerifyBusinessDto {
  @StringFieldOptional({
    each: true,
    swaggerOptions: { example: [BUSINESS_STATUS.VERIFY] },
  })
  status: BUSINESS_STATUS[];
}
