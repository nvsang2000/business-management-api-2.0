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
  UpdateScratchBusinessDto,
  ExportBusinessDto,
} from './dto';
import { BUSINESS_STATUS, MESSAGE_ERROR } from 'src/constants';
import { UserEntity } from 'src/entities';
import { PaginationMetaParams } from '../../dto/paginationMeta.dto';
import { isBoolean } from 'lodash';
import { Response } from 'express';
import { isNumberString } from 'class-validator';
import { FetchBusinessDto } from './dto/fetch-business.dto';
import { ExportService } from 'src/shared/export/export.service';

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    private exportService: ExportService,
  ) {}

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

  private readonly includeVerifyle = {
    verifyDisplayNameBy: {
      select: {
        id: true,
        displayName: true,
      },
    },
    verifyPhoneNumberBy: {
      select: {
        id: true,
        displayName: true,
      },
    },
    verifyAddressBy: {
      select: {
        id: true,
        displayName: true,
      },
    },
  };

  createQuery(fetchDto: FetchBusinessDto) {
    const { search, address, categories, city, state, zipCode } = fetchDto;

    const isActive = !!fetchDto?.isActive
      ? fetchDto.isActive === 'true'
      : undefined;

    return {
      ...(address && {
        address: { in: address },
      }),
      ...(zipCode && {
        zipCode: { in: zipCode },
      }),
      ...(state && {
        state: { in: state, mode: 'insensitive' as any },
      }),
      ...(city && {
        city: { in: city, mode: 'insensitive' as any },
      }),
      ...(categories && {
        category: {
          some: {
            id: {
              in: categories?.map((i) => i),
            },
          },
        },
      }),
      ...(search && {
        OR: [
          isNumberString(search)
            ? {
                phone: { contains: search },
              }
            : {
                name: {
                  contains: search,
                  mode: 'insensitive' as any,
                },
              },
        ],
      }),
      ...(isBoolean(isActive) && { isActive }),
    };
  }

  async paginate(
    fetchDto: FetchBusinessDto,
    response: Response,
    isFindAll?: boolean,
  ): Promise<any[]> {
    try {
      const { limit, page, sortBy, sortDirection } = fetchDto;
      const where = this.createQuery(fetchDto);
      const result = await this.prisma.business.findMany({
        where,
        include: {
          ...this.include,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        ...(!isFindAll && {
          take: +limit,
          skip: (+page - 1) * +limit,
        }),
        orderBy: { [sortBy]: sortDirection },
      });

      const totalDocs = await this.prisma.business.count({ where });

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

  async findByAddressStateZipCode(
    address: string,
    state: string,
    zipCode: string,
  ) {
    try {
      const result = await this.prisma.business.findUnique({
        where: { address_zipcode_state: { address, state, zipCode } },
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

  async findById(id: string) {
    try {
      const result = await this.prisma.business.findUnique({
        where: { id },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async create(
    createBusiness: CreateBusinessDto | any,
    currentUser: UserEntity = null,
  ): Promise<any> {
    try {
      const { categories } = createBusiness;

      const result = await this.prisma.business.create({
        data: {
          ...createBusiness,
          creatorId: currentUser?.id,
          category: {
            connect: categories && categories?.map((id: string) => ({ id })),
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
    updateBusiness: UpdateScratchBusinessDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const { categories } = updateBusiness;
      const result = await this.prisma.business.update({
        where: { id },
        data: {
          ...updateBusiness,
          updatedAt: new Date(),
          updatedById: currentUser?.id,
          category: {
            connect: categories?.map((name: string) => ({ name })),
          },
        },
      });
      return result;
    } catch (e) {
      console.log(e);
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

  async createScratchBusiness(
    createBusiness: CreateScratchBusinessDto,
    currentUser: UserEntity = null,
  ): Promise<any> {
    try {
      const { categories } = createBusiness;
      const result = await this.prisma.business.create({
        data: {
          ...createBusiness,
          creatorId: currentUser?.id,
          status: [BUSINESS_STATUS.NEW],
          category: {
            connect:
              categories && categories?.map((name: string) => ({ name })),
          },
        },
      });
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async getExport(fetchDto: ExportBusinessDto, response: Response) {
    try {
      const { isFindAll } = fetchDto;
      const business = await this.paginate(fetchDto, response, isFindAll);

      const headerRow = [
        'Id',
        'Name',
        'Number',
        'Website',
        'Address',
        'ZipCode',
        'State',
        'City',
        'Categories',
      ];

      const bodyRow = business?.map((i: any) => {
        const categories = i?.category?.map((i: any) => i?.name);
        return [
          i?.id,
          i?.name,
          i?.phone,
          i?.website,
          i?.address,
          i?.zipCode,
          i?.state,
          i?.city,
          categories,
        ];
      });

      const result = await this.exportService.exportExcel([
        headerRow,
        ...bodyRow,
      ]);
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }
}
