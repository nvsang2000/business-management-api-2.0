/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import {
  API_HOST,
  ASSETS_CSV_DIR,
  EXPORT_MODE,
  FILE_TYPE,
} from 'src/constants';
import * as XLSX from 'xlsx-js-style';
import { ExportBusinessDto } from './dto/export-business.dto';
import { BusinessEntity, UserEntity } from 'src/entities';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { BusinessService } from 'src/modules/business/business.service';
import { FilesService } from 'src/modules/files/files.service';
import { PrismaService } from 'nestjs-prisma';

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
  'source',
];
@Injectable()
export class ExportService {
  constructor(
    private configService: ConfigService,
    private fileService: FilesService,
    private businessSerivce: BusinessService,
    private prisma: PrismaService,
    @InjectQueue('export-queue')
    private importQueue: Queue,
  ) {}

  async createExport(
    fetchDto: ExportBusinessDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const where = this.businessSerivce.createQuery(fetchDto);
      const totalDocs = await this.prisma.business.count({ where });
      const businessList = await this.handleFindAllData(fetchDto);
      if (totalDocs > 100000) {
        await this.importQueue.add(
          'export-business',
          { fetchDto, currentUser },
          {
            removeOnComplete: true,
            removeOnFail: true,
            attempts: 0,
          },
        );
        return {
          message:
            'The data to be processed is too large, please check your profile when you receive the notification!',
        };
      } else return await this.createFileExcel(businessList, currentUser);
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async runExportBusiness(bull) {
    const { fetchDto, currentUser } = bull.data;
    try {
      const businessList = await this.handleFindAllData(fetchDto);
      const result = await this.createFileExcel(businessList, currentUser);
      return result;
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
          i?.source,
        ];
        return row;
      });

      const rawData = [HEADER_ROW_BUSINESS, ...bodyRow];
      const result = await this.exportExcel(rawData);
      await this.fileService.create(
        { ...result, type: FILE_TYPE.excel },
        currentUser,
      );
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async handleFindAllData(fetchDto: ExportBusinessDto) {
    const { mode } = fetchDto;
    try {
      let businessList = [];
      if (mode === EXPORT_MODE.all) {
        let hasMore = true;
        let cursor = null;
        fetchDto.limit = '10000';
        while (hasMore) {
          const businessMore = await this.businessSerivce.findAllExport(
            fetchDto,
            cursor,
          );
          if (businessMore.length === 1) hasMore = false;
          else {
            businessList = businessList.concat(businessMore);
            cursor = businessMore[businessMore.length - 1].id;
          }
        }
      } else businessList = await this.businessSerivce.findAllExport(fetchDto);
      return businessList;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async exportExcel(rawDatas: any) {
    try {
      const dir = await this.configService.get(ASSETS_CSV_DIR);
      const apiHost = await this.configService.get(API_HOST);
      const fileName = `BUSINESS_${dayjs().format(
        'DD-MM-YYYY',
      )}_${Date.now().toString()}.csv`;
      const tempFilePath = `${dir}/${fileName}`;
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(rawDatas);

      XLSX.utils.book_append_sheet(workbook, worksheet, 'business');
      XLSX.writeFile(workbook, tempFilePath);

      return {
        name: fileName,
        url: `${apiHost}assets/csv/${fileName}`,
      };
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
}
