import { StringFieldOptional } from 'src/decorators';

export class LimitVerifyDto {
  @StringFieldOptional({ number: true })
  limit?: string = '10';
}
