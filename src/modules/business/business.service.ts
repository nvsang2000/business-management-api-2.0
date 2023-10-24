/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  CreateBusinessDto,
  CreateScratchBusinessDto,
  UpdateBusinessDto,
  UpdateScratchBusinessDto,
  UpdateStatusMarketingBusinessDto,
} from './dto';
import {
  BUSINESS_STATUS,
  GOOOGLE_VERIFY,
  LINK_SOURCE,
  MESSAGE_ERROR,
  STRING_BOOLEAN,
} from 'src/constants';
import { UserEntity } from 'src/entities';
import { PaginationMetaParams } from '../../dto/paginationMeta.dto';
import { Response } from 'express';
import { isNumberString } from 'class-validator';
import { FetchBusinessDto } from './dto/fetch-business.dto';
import { generateSlug } from 'src/helper';

const statusUser = ['ACCEPT', 'PROCESSING', 'CUSTOMER', 'CANCEL'];
@Injectable()
export class BusinessService {
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

  createQuery(fetchDto: FetchBusinessDto) {
    const {
      search,
      statusMarketing,
      userMarketingId,
      googleVerify,
      website,
      address,
      city,
      zipCode,
      source,
    } = fetchDto;
    let { categories, state } = fetchDto;
    const boolGoogleVerify =
      googleVerify === GOOOGLE_VERIFY.VERIFY ? true : false;

    categories && (categories = []?.concat(categories)?.flat(Infinity));
    state && (state = []?.concat(state)?.flat(Infinity));

    return {
      ...(source && { scratchLink: { contains: LINK_SOURCE[source] } }),
      ...(website && {
        website: website === STRING_BOOLEAN.TRUE ? { not: null } : null,
      }),
      ...(googleVerify && {
        googleVerify: { equals: boolGoogleVerify },
      }),
      ...(userMarketingId &&
        statusUser?.includes(statusMarketing) && {
          userMarketingId: { equals: userMarketingId },
          statusMarketing: { equals: statusMarketing },
        }),
      ...(!statusUser?.includes(statusMarketing) && {
        statusMarketing: { equals: statusMarketing },
      }),
      ...(categories && { categories: { hasSome: categories } }),
      ...(state && { state: { in: state, mode: 'insensitive' as any } }),
      ...(zipCode && { zipCode: { contains: zipCode } }),
      ...(city && { city: { contains: city, mode: 'insensitive' as any } }),
      ...(address && {
        address: { contains: address, mode: 'insensitive' as any },
      }),
      ...(search && {
        OR: [
          isNumberString(search)
            ? { phone: { contains: search } }
            : { name: { contains: search, mode: 'insensitive' as any } },
        ],
      }),
    };
  }

  async paginate(
    fetchDto: FetchBusinessDto,
    response: Response,
  ): Promise<any[]> {
    try {
      const { limit, page, sortBy, sortDirection } = fetchDto;
      const where = this.createQuery(fetchDto);
      const result = await this.prisma.business.findMany({
        where,
        include: { ...this.include },
        take: +limit,
        skip: (+page - 1) * +limit,
        orderBy: { [sortBy]: sortDirection },
      });

      const totalDocs = await this.prisma.business.count({ where });

      if (response && response.set) {
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

  async findById(id: string) {
    try {
      const result = await this.prisma.business.findUnique({
        where: { id },
        include: {
          userMarketing: {
            select: {
              id: true,
              displayName: true,
            },
          },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findByGoogleMapId(id: string) {
    try {
      const result = await this.prisma.business.findUnique({
        where: { googleMapId: id },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findByScratchLink(scratchLink: string) {
    try {
      const result = await this.prisma.business.findUnique({
        where: { scratchLink },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async findFistOne(name: string, phone: string, address: string) {
    try {
      const result = await this.prisma.business.findFirst({
        where: { AND: { name, phone, address } },
      });
      return result;
    } catch (e) {
      console.log('err', e);
      throw new UnprocessableEntityException(e.message);
    }
  }

  async update(
    id: string,
    updateBusiness: UpdateBusinessDto | any,
    currentUser: UserEntity,
  ) {
    try {
      const result = await this.prisma.business.update({
        where: { id },
        data: {
          ...updateBusiness,
          ...(currentUser && {
            updatedBy: { connect: { id: currentUser?.id } },
          }),
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async create(
    createBusiness: CreateBusinessDto,
    currentUser: UserEntity = null,
  ): Promise<any> {
    try {
      const result = await this.prisma.business.create({
        data: {
          ...createBusiness,
          creator: { connect: { id: currentUser?.id } },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async delete(id: string) {
    try {
      const business = await this.findById(id);
      if (!business) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
      const result = await this.prisma.business.delete({ where: { id } });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async updateMarketing(
    id: string,
    statusMarketing: UpdateStatusMarketingBusinessDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const result = await this.prisma.business.update({
        where: { id },
        data: {
          ...statusMarketing,
          userMarketing: { connect: { id: currentUser?.id } },
          updatedBy: { connect: { id: currentUser?.id } },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async updateScratchBusiness(
    id: string,
    updateBusiness: UpdateScratchBusinessDto,
    userId?: string,
  ) {
    try {
      const { categories } = updateBusiness;
      const result = await this.prisma.business.update({
        where: { id },
        data: {
          ...updateBusiness,
          ...(userId && { updatedBy: { connect: { id: userId } } }),
          ...(categories?.length > 0 && {
            category: {
              connectOrCreate: categories?.map((name) => ({
                where: { name },
                create: { name, slug: generateSlug(name) },
              })),
            },
          }),
        },
      });
      return result;
    } catch (e) {
      console.log('err', e);
      throw new UnprocessableEntityException(e.message);
    }
  }

  async createScratchBusiness(
    createBusiness: CreateScratchBusinessDto,
    userId?: string,
  ): Promise<any> {
    try {
      const { categories } = createBusiness;
      const result = await this.prisma.business.create({
        data: {
          status: [BUSINESS_STATUS.NEW],
          ...createBusiness,
          ...(userId && { creator: { connect: { id: userId } } }),
          ...(categories?.length > 0 && {
            category: {
              connectOrCreate: categories?.map((name) => ({
                where: { name },
                create: { name, slug: generateSlug(name) },
              })),
            },
          }),
        },
      });
      return result;
    } catch (e) {
      console.log('err', e);
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
