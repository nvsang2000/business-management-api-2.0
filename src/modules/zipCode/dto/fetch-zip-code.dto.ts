import { StringFieldOptional } from 'src/decorators';

export class FetchZipCodeDto {
  @StringFieldOptional({ swaggerOptions: { example: 'CA' } })
  stateCode?: string;

  @StringFieldOptional({ swaggerOptions: { example: 'Alameda' } })
  countyName?: string;
}
