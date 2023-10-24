/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ExportService } from 'src/shared/export/export.service';
import { ExportBusinessDto, FetchBusinessDto } from './dto';
import { BusinessService } from './business.service';
import { BusinessEntity, UserEntity } from 'src/entities';
import { FilesService } from '../files/files.service';
import { FILE_TYPE } from 'src/constants';

export const HEADER_ROW_BUSINESS = [
  'id',
  'name',
  'phone',
  'website',
  'address',
  'city',
  'state',
  'zipCode',
  'categories',
  'scratchLink',
  'thumbnailUrl',
];
@Injectable()
export class ExportBusinessService {
  constructor(
    private prisma: PrismaService,
    private businessService: BusinessService,
    private exportService: ExportService,
    private filesService: FilesService,
  ) {}

  async findAllExport(fetchDto: FetchBusinessDto, lastId?: string) {
    try {
      const { page, limit } = fetchDto;
      const where = this.businessService.createQuery(fetchDto);
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
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createExport(
    fetchDto: ExportBusinessDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const businessList = await this.handleFindAllData(fetchDto);
      return await this.createFileExcel(businessList, currentUser);
    } catch (e) {
      console.log(e);
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async handleFindAllData(fetchDto: ExportBusinessDto) {
    const { isAll } = fetchDto;
    try {
      let businessList = [];
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
      return businessList;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createFileExcel(
    businessList: BusinessEntity[],
    currentUser: UserEntity,
  ) {
    try {
      const bodyRow = businessList?.map((i: BusinessEntity) => {
        const row = [
          i?.id,
          i?.name,
          i?.phone,
          i?.website,
          i?.address,
          i?.city,
          i?.state,
          i?.zipCode,
          i?.categories?.join(', '),
          i?.scratchLink,
          i?.thumbnailUrl,
        ];
        return row;
      });

      const rawData = [HEADER_ROW_BUSINESS, ...bodyRow];
      const result = await this.exportService.exportExcel(rawData);
      await this.filesService.create(
        { ...result, type: FILE_TYPE.excel },
        currentUser,
      );

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
