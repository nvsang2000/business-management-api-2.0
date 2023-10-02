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
  Res,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto';
import { UsersService } from './users.service';
import { FetchDto } from '../../dto/fetch.dto';
import { UpdateUserDto } from './dto';
import { Response } from 'express';
import { Roles } from 'src/decorators';
import { ROLE } from 'src/constants';

@ApiTags('Users')
@Controller('users')
@ApiBasicAuth('access-token')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get()
  @Roles([ROLE.admin])
  @UseInterceptors(ClassSerializerInterceptor)
  paginate(
    @Query() fetchDto: FetchDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    return this.userService.paginate(fetchDto, res);
  }

  @Get(':id')
  @Roles([ROLE.admin])
  @UseInterceptors(ClassSerializerInterceptor)
  async findUnique(@Param('id') id: string) {
    return this.userService.findUnique(id);
  }

  @Post()
  @Roles([ROLE.admin])
  @UseInterceptors(ClassSerializerInterceptor)
  async create(@Body() payload: CreateUserDto) {
    return this.userService.create(payload);
  }

  @Put(':id')
  @Roles([ROLE.admin])
  @HttpCode(200)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(@Param('id') id: string, @Body() payload: UpdateUserDto) {
    return this.userService.update(payload, id);
  }

  @Delete(':id')
  @Roles([ROLE.admin])
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
