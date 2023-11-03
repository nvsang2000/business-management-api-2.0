/*
https://docs.nestjs.com/controllers#controllers
*/

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { FetchDto } from 'src/dto';
import { Response } from 'express';
import { CurrentUser } from 'src/decorators';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UserEntity } from 'src/entities';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
@ApiBasicAuth('access-token')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  paginate(
    @Query() fetchDto: FetchDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.categoriesService.paginate(fetchDto, res);
  }

  @Get('list')
  list() {
    return this.categoriesService.list();
  }

  @Post()
  create(
    @Body() payload: CreateCategoryDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.categoriesService.create(payload, currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateCategoryDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.categoriesService.update(id, payload, currentUser);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
