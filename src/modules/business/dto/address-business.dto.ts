import { StringFieldOptional } from 'src/decorators';
export class AddressBusinessDto {
  @StringFieldOptional({})
  link: string;

  @StringFieldOptional({})
  title: string;
}
