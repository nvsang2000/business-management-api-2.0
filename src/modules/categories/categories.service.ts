/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UserEntity } from 'src/entities';
import { MESSAGE_ERROR } from 'src/constants';
import { FetchDto, PaginationMetaParams } from 'src/dto';
import { Response } from 'express';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async paginate(fetchDto: FetchDto, response: Response): Promise<any[]> {
    try {
      const { limit, page, search } = fetchDto;
      const result = await this.prisma.category.findMany({
        where: {
          ...(search && {
            name: { contains: search, mode: 'insensitive' as any },
          }),
        },
        take: +limit,
        skip: (+page - 1) * +limit,
      });

      const totalDocs = await this.prisma.category.count();

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
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
  async list() {
    try {
      const result = await this.prisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findById(id: string): Promise<any> {
    try {
      const result = await this.prisma.category.findUnique({
        where: { id },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findByName(name: string): Promise<any> {
    try {
      const result = await this.prisma.category.findUnique({
        where: { name },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findBySlug(slug: string): Promise<any> {
    try {
      const result = await this.prisma.category.findUnique({
        where: { slug },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async update(
    id: string,
    updateCategory: UpdateCategoryDto,
    currentUser: UserEntity = null,
  ) {
    const { name, slug } = updateCategory;
    const checkId = await this.findById(id);
    if (!checkId) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
    const checkName = await this.findByName(name);
    if (checkName)
      throw new BadRequestException('Name category already exists!');

    const checkSlug = await this.findBySlug(slug);
    if (checkSlug)
      throw new BadRequestException('Slug category already exists!');
    try {
      const result = await this.prisma.category.update({
        where: { id },
        data: {
          ...updateCategory,
          updatedBy: { connect: { id: currentUser?.id } },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async upsert(
    upsertCategories: CreateCategoryDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const result = await this.prisma.category.upsert({
        where: { name: upsertCategories.name },
        create: {
          ...upsertCategories,
          creator: { connect: { id: currentUser?.id } },
        },
        update: upsertCategories,
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async create(
    createCategory: CreateCategoryDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const result = await this.prisma.category.create({
        data: {
          ...createCategory,
          creator: { connect: { id: currentUser?.id } },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async delete(id: string) {
    const category = await this.findById(id);
    if (!category) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
    try {
      const result = await this.prisma.category.delete({ where: { id } });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }
}
