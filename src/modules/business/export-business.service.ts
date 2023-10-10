/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ExportService } from 'src/shared/export/export.service';
import { ExportBusinessDto, FetchBusinessDto } from './dto';
import { BusinessService } from './business.service';
import { BusinessEntity, UserEntity } from 'src/entities';
import { HEADER_ROW_BUSINESS } from 'src/constants';
import { FilesService } from '../files/files.service';

@Injectable()
export class ExportBusinessService {
  constructor(
    private prisma: PrismaService,
    private businessService: BusinessService,
    private exportService: ExportService,
    private filesService: FilesService,
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
  async findAllExport(fetchDto: FetchBusinessDto, lastId?: string) {
    try {
      const { page, limit } = fetchDto;
      const where = this.businessService.createQuery(fetchDto);
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
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createExport(
    fetchDto: ExportBusinessDto,
    currentUser: UserEntity = null,
  ) {
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

      return await this.createFileExcel(businessList, currentUser);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async createFileExcel(
    businessList: BusinessEntity[],
    currentUser: UserEntity,
  ) {
    try {
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
      await this.filesService.createFileExcel(result, currentUser);

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
