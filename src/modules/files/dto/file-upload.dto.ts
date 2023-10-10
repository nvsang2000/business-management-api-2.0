import { StringFieldOptional } from 'src/decorators';

export class FileUpload {
  @StringFieldOptional({})
  name?: string;
}
