import { StringFieldOptional } from 'src/decorators';

export class ImportBusinessDto {
  @StringFieldOptional({ number: true })
  limit?: string = '10';
}
