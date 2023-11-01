/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from 'src/decorators';
import { UserEntity } from 'src/entities';
import { FilesService } from './files.service';
import { FetchDto } from 'src/dto/fetch.dto';
import { Response } from 'express';

@ApiTags('Files')
@ApiBasicAuth('access-token')
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @UploadedFile() image: Express.Multer.File,
    @CurrentUser() currentUser: UserEntity,
  ): Promise<any> {
    return this.filesService.createFileImage(image, currentUser);
  }

  @Get('/')
  paginate(
    @Query() fetchDto: FetchDto,
    @CurrentUser() currentUser: UserEntity,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.filesService.paginate(fetchDto, currentUser, res);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.filesService.findById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.filesService.delete(id);
  }
}
