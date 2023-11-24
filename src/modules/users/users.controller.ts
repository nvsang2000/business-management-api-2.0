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
import { UpdateUserDto } from './dto';
import { Response } from 'express';
import { CurrentUser, Roles } from 'src/decorators';
import { ROLE, ROLE_ADMIN } from 'src/constants';
import { FetchDto } from 'src/dto';
import { UserEntity } from 'src/entities';

@ApiTags('Users')
@Controller('users')
@ApiBasicAuth('access-token')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get()
  @Roles(ROLE_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  paginate(
    @Query() fetchDto: FetchDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    return this.userService.paginate(fetchDto, res);
  }

  @Get(':id')
  @Roles(ROLE_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  async findUnique(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  @Roles(ROLE_ADMIN)
  @UseInterceptors(ClassSerializerInterceptor)
  async create(@Body() payload: CreateUserDto) {
    return this.userService.create(payload);
  }

  @Put(':id')
  @Roles(ROLE_ADMIN)
  @HttpCode(200)
  @UseInterceptors(ClassSerializerInterceptor)
  async update(
    @Param('id') id: string,
    @Body() payload: UpdateUserDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    return this.userService.update(currentUser, payload, id);
  }

  @Delete(':id')
  @Roles([ROLE.adminSys])
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
