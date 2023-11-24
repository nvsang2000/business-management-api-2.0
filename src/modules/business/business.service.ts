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
  VerifyBusinessDto,
} from './dto';
import {
  BUSINESS_STATUS,
  EXPORT_MODE,
  GOOOGLE_VERIFY,
  MESSAGE_ERROR,
  ROLE_ADMIN,
  SOURCE_SCRATCH,
  STRING_BOOLEAN,
} from 'src/constants';
import { UserEntity } from 'src/entities';
import { PaginationMetaParams } from '../../dto/paginationMeta.dto';
import { Response } from 'express';
import { isNumberString } from 'class-validator';
import { FetchBusinessDto } from './dto/fetch-business.dto';
import { generateSlug } from 'src/helper';

const statusUser = [2, 3, 4, 5];
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

  createQuery(fetchDto: any, currentUser?: UserEntity) {
    const {
      search,
      statusMarketing,
      googleVerify,
      website,
      address,
      city,
      zipCode,
      source,
      mode,
      ids,
      keyword,
      thumbnailUrl,
      statusWebsite,
      email,
    } = fetchDto;
    let { categories, state } = fetchDto;
    const isAdmin = ROLE_ADMIN.includes(currentUser?.role);
    const boolGoogleVerify =
      googleVerify === GOOOGLE_VERIFY.VERIFY ? true : false;

    categories && (categories = []?.concat(categories)?.flat(Infinity));
    state && (state = []?.concat(state)?.flat(Infinity));
    if ([EXPORT_MODE.selected].includes(mode)) {
      if (!ids)
        throw new BadRequestException(
          'Export mode by selected require specify has row select !',
        );

      return { id: { in: ids } };
    }
    return {
      ...(email && {
        email: email === STRING_BOOLEAN.TRUE ? { not: null } : null,
      }),
      ...(statusWebsite && { statusWebsite: { equals: statusWebsite } }),
      ...(keyword && {
        keyword: { contains: keyword, mode: 'insensitive' as any },
      }),
      ...(source && { source: { equals: source } }),
      ...(thumbnailUrl && {
        thumbnailUrl:
          thumbnailUrl === STRING_BOOLEAN.TRUE ? { not: null } : null,
      }),
      ...(website && {
        website: website === STRING_BOOLEAN.TRUE ? { not: null } : null,
      }),
      ...(googleVerify && {
        googleVerify: { equals: boolGoogleVerify },
      }),
      ...(statusUser?.includes(statusMarketing) && {
        statusMarketing: { equals: statusMarketing },
        ...(!isAdmin && {
          userMarketingId: { equals: currentUser?.id },
        }),
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
    response?: Response,
    currentUser?: UserEntity,
  ): Promise<any[]> {
    try {
      const { limit, page, sortBy, sortDirection } = fetchDto;
      const where = this.createQuery(fetchDto, currentUser);

      const result = await this.prisma.business.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          website: true,
          state: true,
          zipCode: true,
          city: true,
          address: true,
          categories: true,
          thumbnailUrl: true,
          source: true,
          createdAt: true,
          statusWebsite: true,
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { [sortBy]: sortDirection },
      });

      const totalDocs = await this.prisma.business.count({ where });

      if (response && response.set) {
        response.set(
          'meta',
          JSON.stringify({
            totalDocs,
            totalPages: Math.ceil(totalDocs / (limit || 10)),
          } as PaginationMetaParams),
        );
      }

      return result;
    } catch (error) {
      throw new UnprocessableEntityException(error.message);
    }
  }

  async findAllExport(
    fetchDto: FetchBusinessDto,
    isAdmin?: boolean,
    lastId?: string,
  ) {
    try {
      let { limit } = fetchDto;
      const { page, sortBy, sortDirection } = fetchDto;
      const where = this.createQuery(fetchDto);
      limit = isAdmin ? limit : 50;
      const result = await this.prisma.business.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          website: true,
          scratchLink: true,
          state: true,
          zipCode: true,
          city: true,
          address: true,
          thumbnailUrl: true,
          categories: true,
          source: true,
          keyword: true,
          email: true,
          statusWebsite: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
        ...(lastId && {
          cursor: { id: lastId },
        }),
        orderBy: { [sortBy]: sortDirection },
      });

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
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

  async update(
    id: string,
    updateBusiness: UpdateBusinessDto | any,
    currentUser: UserEntity,
  ) {
    const checkId = await this.findById(id);
    if (!checkId) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
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
    const business = await this.findById(id);
    if (!business) throw new BadRequestException(MESSAGE_ERROR.NOT_FUND_DATA);
    try {
      const result = await this.prisma.business.delete({ where: { id } });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async verify(
    id: string,
    verify: VerifyBusinessDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const result = await this.prisma.business.update({
        where: { id },
        data: {
          ...verify,
          updatedBy: { connect: { id: currentUser?.id } },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
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

  // Scratch business
  async findByScratchLink(scratchLink: string) {
    try {
      const result = await this.prisma.business.findUnique({
        where: { scratchLink },
        select: {
          id: true,
          categories: true,
          website: true,
          name: true,
          phone: true,
          email: true,
          thumbnailUrl: true,
          statusWebsite: true,
        },
      });
      return result;
    } catch (e) {
      console.log(e.message);
    }
  }

  async findFistOne(name: string, phone: string, address: string) {
    try {
      const result = await this.prisma.business.findFirst({
        where: {
          AND: {
            name: { contains: name, mode: 'insensitive' as any },
            address: { contains: address, mode: 'insensitive' as any },
            phone,
          },
        },
        select: {
          id: true,
          source: true,
        },
      });
      return result;
    } catch (e) {
      console.log(e.message);
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
        select: {
          id: true,
        },
      });
      return result;
    } catch (e) {
      console.log(e.message);
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
                where: { slug: generateSlug(name) },
                create: { name, slug: generateSlug(name) },
              })),
            },
          }),
        },
        select: {
          id: true,
        },
      });
      return result;
    } catch (e) {
      console.log(e.message);
    }
  }

  async saveScratchBusiness(
    business: CreateScratchBusinessDto,
    isImport: boolean,
  ) {
    try {
      const { name, phone, address, scratchLink, statusWebsite } = business;
      const checkScratch = await this.findByScratchLink(scratchLink);
      const checkDuplicate = await this.findFistOne(name, phone, address);
      if (!checkDuplicate && !checkScratch)
        return await this.createScratchBusiness(business);
      else {
        if (checkScratch) {
          if (isImport) {
            const newBusiness: any = { statusWebsite };
            if (!checkScratch?.email) newBusiness.email = business?.email;
            if (!checkScratch?.name) newBusiness.name = business?.name;
            if (!checkScratch?.phone) newBusiness.phone = business?.phone;
            if (!checkScratch?.thumbnailUrl)
              newBusiness.thumbnailUrl = business?.thumbnailUrl;
            if (!checkScratch?.website) newBusiness.website = business?.website;
            if (Object?.values(newBusiness)?.length > 0)
              return await this.updateScratchBusiness(
                checkDuplicate?.id,
                newBusiness,
              );
          } else return;
        } else {
          if (checkDuplicate?.source === SOURCE_SCRATCH.YELLOW_PAGES)
            return await this.updateScratchBusiness(
              checkDuplicate?.id,
              business,
            );
        }
      }
    } catch (e) {
      console.log(e.message);
    }
  }
}
