/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Param } from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { CategoryService } from './category.service';

@ApiTags('Category')
@Controller('category')
@ApiBasicAuth('access-token')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Get('list')
  list() {
    return this.categoryService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }
}
