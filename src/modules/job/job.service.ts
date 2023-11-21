/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { FetchDto } from 'src/dto/fetch.dto';
import { CreateJobSearchBusinessDto, UpdateScratchDto } from './dto';
import { PaginationMetaParams } from 'src/dto/paginationMeta.dto';
import { Response } from 'express';
import { MESSAGE_ERROR } from 'src/constants';

@Injectable()
export class JobService {
  constructor(private prisma: PrismaService) {}
  private readonly include = {
    creator: {
      select: {
        id: true,
        displayName: true,
      },
    },
    updatedBy: {
      select: {
        id: true,
        displayName: true,
      },
    },
  };

  async paginate(fetchDto: FetchDto, response: Response): Promise<any[]> {
    try {
      const { limit, page, sortBy, sortDirection } = fetchDto;
      const result = await this.prisma.job.findMany({
        select: {
          id: true,
          keyword: true,
          state: true,
          county: true,
          status: true,
          duration: true,
          createdAt: true,
          ...this.include,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [sortBy]: sortDirection },
      });

      const totalDocs = await this.prisma.job.count();

      if (response.set) {
        response.set(
          'meta',
          JSON.stringify({
            totalDocs,
            totalPages: Math.ceil(totalDocs / (limit || 10)),
          } as PaginationMetaParams),
        );
      }

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findById(id: string): Promise<any> {
    try {
      const result = await this.prisma.job.findUnique({
        where: { id },
        select: {
          ...this.include,
          id: true,
          keyword: true,
          state: true,
          county: true,
          status: true,
          statusData: true,
          duration: true,
          createdAt: true,
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findOne(id: string): Promise<any> {
    try {
      const result = await this.prisma.job.findUnique({
        where: { id },
        select: {
          ...this.include,
          id: true,
          keyword: true,
          state: true,
          county: true,
          status: true,
          duration: true,
          createdAt: true,
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async create(
    createJob: CreateJobSearchBusinessDto | any,
    userId: string,
  ): Promise<any> {
    try {
      const result = await this.prisma.job.create({
        data: {
          ...createJob,
          creatorId: userId,
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async update(
    id: string,
    updateJob: UpdateScratchDto,
    userId?: string,
  ): Promise<any> {
    try {
      const result = await this.prisma.job.update({
        data: {
          ...updateJob,
          updatedById: userId,
        },
        where: { id },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async delete(id: string) {
    try {
      const job = await this.findById(id);
      if (!job) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
      const result = await this.prisma.job.delete({ where: { id } });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }
}
