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
} from '@nestjs/common';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from './dto';
import { UsersService } from './users.service';
import { FetchDto } from '../../dto/fetch.dto';
import { UpdateUserDto } from './dto';
import { Response } from 'express';

@ApiTags('Users')
@Controller('users')
@ApiBasicAuth('access-token')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get()
  paginate(
    @Query() fetchDto: FetchDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    return this.userService.paginate(fetchDto, res);
  }

  @Get(':id')
  async findUnique(@Param('id') id: string) {
    return this.userService.findUnique(id);
  }

  @Post()
  async create(@Body() payload: CreateUserDto) {
    return this.userService.create(payload);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() payload: UpdateUserDto) {
    return this.userService.update(payload, id);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
