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
import {
  BUSINESS_STATUS,
  HEADER_ROW_BUSINESS,
  MESSAGE_ERROR,
} from 'src/constants';
import { BusinessEntity, UserEntity } from 'src/entities';
import { PaginationMetaParams } from '../../dto/paginationMeta.dto';
import { Response } from 'express';
import { isNumberString } from 'class-validator';
import { FetchBusinessDto } from './dto/fetch-business.dto';
import { ExportService } from 'src/shared/export/export.service';
import { generateSlug } from 'src/helper';
import { ZipCodeService } from '../zipCode/zip-code.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class BusinessService {
  constructor(
    private prisma: PrismaService,
    private exportService: ExportService,
    private zipCodeService: ZipCodeService,
    @InjectQueue('job-export-business')
    private exportQueue: Queue,
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
    const { search } = fetchDto;
    let { categories, city, state, zipCode } = fetchDto;

    categories && (categories = []?.concat(categories)?.flat(Infinity));
    city && (city = []?.concat(city)?.flat(Infinity));
    state && (state = []?.concat(state)?.flat(Infinity));
    zipCode && (zipCode = []?.concat(zipCode)?.flat(Infinity));

    return {
      ...(zipCode && { zipCode: { in: zipCode } }),
      ...(state && { state: { in: state, mode: 'insensitive' as any } }),
      ...(city && { city: { in: city, mode: 'insensitive' as any } }),
      ...(categories && { categories: { hasEvery: categories } }),
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

  async updateScratchBusiness(
    id: string,
    updateBusiness: UpdateScratchBusinessDto,
    userId: string,
  ) {
    try {
      const { categories, city, state, zipCode } = updateBusiness;
      const findZipCode = await this.zipCodeService.getCity(
        city,
        state,
        zipCode,
      );
      const result = await this.prisma.business.update({
        where: { id },
        data: {
          ...updateBusiness,
          updatedBy: { connect: { id: userId } },
          ...(findZipCode && {
            cityName: { connect: { id: findZipCode?.id } },
          }),
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
      throw new UnprocessableEntityException(e.message);
    }
  }

  async createScratchBusiness(
    createBusiness: CreateScratchBusinessDto,
    userId: string,
  ): Promise<any> {
    try {
      const { categories, city, state, zipCode } = createBusiness;
      const findZipCode = await this.zipCodeService.getCity(
        city,
        state,
        zipCode,
      );
      const result = await this.prisma.business.create({
        data: {
          ...createBusiness,
          status: [BUSINESS_STATUS.NEW],
          creator: { connect: { id: userId } },
          ...(findZipCode && {
            cityName: { connect: { id: findZipCode?.id } },
          }),
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
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async findAllExport(fetchDto: FetchBusinessDto, lastId?: string) {
    try {
      const { page, limit } = fetchDto;
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
        take: +limit,
        skip: (+page - 1) * +limit,
        ...(lastId && {
          cursor: { id: lastId },
        }),
        orderBy: { createdAt: 'desc' },
      });

      return result;
    } catch (e) {
      console.log(e);
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async createExport(fetchDto: ExportBusinessDto) {
    try {
      let businessList = [];
      const { isAll } = fetchDto;
      if (isAll) {
        let hasMore = true;
        let cursor = null;
        fetchDto.limit = '10000';
        while (hasMore) {
          const businessMore = await this.findAllExport(fetchDto, cursor);
          if (businessMore.length === 1) hasMore = false;
          else {
            businessList = businessList.concat(businessMore);
            cursor = businessMore[businessMore.length - 1].id;
          }
        }
      } else businessList = await this.findAllExport(fetchDto);

      return await this.createFileExcel(businessList);
    } catch (e) {
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async createFileExcel(businessList: BusinessEntity[]) {
    const bodyRow = businessList?.map((i: any) => {
      const categories = i?.category?.map((i: any) => i?.name);
      return [
        i?.id,
        i?.name,
        i?.phone,
        i?.website,
        i?.address,
        i?.city,
        i?.state,
        i?.zipCode,
        categories,
      ];
    });

    const result = await this.exportService.exportExcel([
      HEADER_ROW_BUSINESS,
      ...bodyRow,
    ]);
    return result;
  }
}
