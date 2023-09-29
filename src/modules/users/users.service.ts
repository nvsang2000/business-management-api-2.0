/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { FetchDto } from '../../dto/fetch.dto';
import { CreateUserDto, UpdateUserDto } from './dto';
import { MESSAGE_ERROR } from 'src/constants';
import { PaginationMetaParams } from '../../dto/paginationMeta.dto';
import { isBoolean } from 'lodash';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
interface FindOneOption {
  id?: string;
  username?: string;
  email?: string;
  phone?: string;
}
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private readonly selected = {
    id: true,
    email: true,
    username: true,
    displayName: true,
    phone: true,
    isActive: true,
    role: true,
    thumbnail: true,
    policyId: true,
    lastSeen: true,
    updatedAt: true,
    createdAt: true,
  };

  createQuery(fetchDto: any) {
    const { search } = fetchDto;

    const isActive = !!fetchDto?.isActive
      ? fetchDto.isActive === 'true'
      : undefined;

    return {
      ...(search && {
        OR: [{ displayName: { contains: search } }],
      }),
      ...(isBoolean(isActive) && { isActive }),
    };
  }

  async paginate(fetchDto: FetchDto, response: Response): Promise<any[]> {
    try {
      const { limit, page, sortBy, sortDirection } = fetchDto;
      const where = this.createQuery(fetchDto);
      const result = await this.prisma.user.findMany({
        where,
        select: {
          ...this.selected,

          policy: {
            select: {
              id: true,
              isActive: true,
              name: true,
            },
          },
        },
        take: +limit,
        skip: (+page - 1) * +limit,
        orderBy: { [sortBy]: sortDirection },
      });

      const totalDocs = await this.prisma.user.count();

      if (response.set) {
        response.set(
          'meta',
          JSON.stringify({
            totalDocs,
            totalPages: Math.ceil(totalDocs / (+limit || 10)),
          } as PaginationMetaParams),
        );
      }

      return result;
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }

  async findUnique(id: string): Promise<any> {
    try {
      const result = await this.prisma.user.findUnique({
        where: { id },
        select: {
          ...this.selected,
          policy: {
            select: {
              id: true,
              isActive: true,
              name: true,
            },
          },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async findFirstOne({
    email,
    username,
    id,
    phone,
  }: FindOneOption): Promise<any> {
    try {
      const result = await this.prisma.user.findFirst({
        where: {
          OR: [{ id }, { username }, { email }, { phone }],
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async create(createUser: CreateUserDto): Promise<any> {
    try {
      const { email, username, phone, password } = createUser;
      const user = await this.findFirstOne({ email, username, phone });
      const hashedPassword = await bcrypt.hash(password, 10);
      if (user)
        throw new BadRequestException(MESSAGE_ERROR.USER_ALREADY_EXISTS);
      const result = await this.prisma.user.create({
        data: {
          ...createUser,
          password: hashedPassword,
        },
        select: { ...this.selected },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async update(updateUser: UpdateUserDto, id: string): Promise<any> {
    try {
      const user = await this.findFirstOne({ id });
      if (!user) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
      const result = await this.prisma.user.update({
        data: updateUser,
        where: { id },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async delete(id: string) {
    try {
      const user = await this.findFirstOne({ id });
      if (!user) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
      const result = await this.prisma.user.delete({ where: { id } });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }
}
