/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Delete, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { FetchDto } from 'src/dto';
import { Response } from 'express';

@ApiTags('Category')
@Controller('category')
@ApiBasicAuth('access-token')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get()
  paginate(
    @Query() fetchDto: FetchDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.categoryService.paginate(fetchDto, res);
  }

  @Get('list')
  list() {
    return this.categoryService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
