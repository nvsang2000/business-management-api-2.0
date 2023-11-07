import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportService } from './import.service';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { ImportBusinessDto } from './dto/import-business.dto';

@ApiTags('Imports')
@ApiBasicAuth('access-token')
@Controller('imports')
export class ImportController {
  constructor(private importService: ImportService) {}

  @Post('/business')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() payload: ImportBusinessDto,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<any> {
    return this.importService.createImportBusiness(file, payload, currentUser);
  }
}
