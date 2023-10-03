import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { isBoolean } from 'class-validator';
import { Response } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { PRISMA_ERROR_CODE } from 'src/constants';
import { PolicyEntity } from 'src/entities';
import { capitalizeFirstLetter } from 'src/helper';
import { PaginationMetaParams } from 'src/dto/paginationMeta.dto';
import { CreatePolicyDto } from './dto/create-policy.dto';
import { FetchPolicyDto } from './dto/fetch-policy.dto';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PolicyService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createPolicyDto: CreatePolicyDto) {
    try {
      const createdPolicy = await this.prismaService.policy.create({
        data: {
          ...createPolicyDto,
          permissions: createPolicyDto.permissions as unknown as any,
        },
      });

      return createdPolicy;
    } catch (e) {
      if (e.code === PRISMA_ERROR_CODE.DUPLICATE) {
        throw new ConflictException(
          `${capitalizeFirstLetter(
            e?.meta?.target?.[0],
          )} has been already taken !`,
        );
      }

      throw e;
    }
  }

  async update(id: number, updatePolicyDto: UpdatePolicyDto) {
    try {
      const updatedPolicy = await this.prismaService.policy.update({
        where: { id },
        data: {
          ...updatePolicyDto,
          permissions: updatePolicyDto.permissions as unknown as any,
        },
      });

      return updatedPolicy;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async paginate(
    fetchPolicyDto: FetchPolicyDto,
    response: Response,
  ): Promise<PolicyEntity[]> {
    try {
      const { limit, page } = fetchPolicyDto;
      const isActive = !!fetchPolicyDto?.isActive
        ? fetchPolicyDto.isActive === 'true'
        : undefined;

      const where = {
        ...(isBoolean(isActive) && { isActive }),
      };

      const result = await this.prismaService.policy.findMany({
        where,
        take: +limit,
        skip: (+page - 1) * +limit,
        orderBy: { createdAt: 'desc' },
      });

      const totalDocs = await this.prismaService.policy.count({ where });

      if (response.set) {
        response.set(
          'meta',
          JSON.stringify({
            totalDocs,
            totalPages: Math.ceil(totalDocs / (+limit || 10)),
          } as PaginationMetaParams),
        );
      }

      return result as unknown as PolicyEntity[];
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }

  async list(fetchPolicyDto: FetchPolicyDto): Promise<PolicyEntity[]> {
    try {
      const isActive = !!fetchPolicyDto?.isActive
        ? fetchPolicyDto.isActive === 'true'
        : undefined;

      const where = {
        ...(isBoolean(isActive) && { isActive }),
      };

      const result = await this.prismaService.policy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
        },
      });

      return result as unknown as PolicyEntity[];
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prismaService.policy.findUnique({
        where: { id },
      });
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async remove(id: number) {
    const policy = await this.prismaService.policy.findUnique({
      where: { id },
    });

    if (!policy) {
      throw new BadRequestException('Policy is not found !');
    }

    try {
      await this.prismaService.policy.delete({ where: { id } });
      return;
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }
}
