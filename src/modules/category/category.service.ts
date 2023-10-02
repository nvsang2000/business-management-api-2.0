/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UserEntity } from 'src/entities';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

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
}
