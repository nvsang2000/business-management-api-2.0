/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import {
  API_HOST,
  ASSETS_CSV_DIR,
  EXPORT_ALL_LIMIT,
  EXPORT_CHUNK_LENGTH,
  EXPORT_MODE,
  FILE_TYPE,
  ROLE,
} from 'src/constants';
import * as XLSX from 'xlsx-js-style';
import { ExportBusinessDto } from './dto/export-business.dto';
import { BusinessEntity, UserEntity } from 'src/entities';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { BusinessService } from 'src/modules/business/business.service';
import { FilesService } from 'src/modules/files/files.service';
import { BullExport } from 'src/interface';
import { chunkArray, promisesSequentially } from 'src/helper';

export const HEADER_ROW_BUSINESS = [
  'id',
  'name',
  'phone',
  'email',
  'website',
  'address',
  'city',
  'state',
  'zipCode',
  'categories',
  'scratchLink',
  'thumbnailUrl',
  'source',
  'keyword',
];
@Injectable()
export class ExportService {
  constructor(
    private configService: ConfigService,
    private fileService: FilesService,
    private businessSerivce: BusinessService,
    @InjectQueue(`export-queue-${process.env.REDIS_SERVER}`)
    private importQueue: Queue,
  ) {}

  async createExport(
    fetchDto: ExportBusinessDto,
    currentUser: UserEntity = null,
  ) {
    try {
      const { mode } = fetchDto;
      const isAdmin = currentUser?.role === ROLE.admin;
      if (mode === EXPORT_MODE.all && isAdmin) {
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
          isProcess: true,
          message:
            'The file will be downloaded when you receive a notification!',
        };
      } else {
        const businessList = await this.handleFindAllData(
          fetchDto,
          currentUser,
        );
        return await this.createFileExcel(businessList, currentUser);
      }
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async runExportBusiness(bull: Job<BullExport>) {
    const { fetchDto, currentUser } = bull.data;
    try {
      const businessList = await this.handleFindAllData(fetchDto, currentUser);
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
    const chunkLength = await this.configService.get(EXPORT_CHUNK_LENGTH);
    try {
      const chunkData = chunkArray(businessList, chunkLength);
      const promiseExport = chunkData?.map(
        (data: BusinessEntity[], index: number) => {
          return async () => {
            try {
              const bodyRow = data?.map((i: BusinessEntity) => {
                const row = [
                  i?.id,
                  i?.name,
                  i?.phone ? `"${i?.phone}"` : undefined,
                  i?.email,
                  i?.website,
                  i?.address,
                  i?.city,
                  i?.state,
                  i?.zipCode ? `"${i?.zipCode}"` : undefined,
                  i?.categories?.join(', '),
                  i?.scratchLink,
                  i?.thumbnailUrl,
                  i?.source,
                  i?.keyword,
                ];
                return row;
              });
              const rawData = [HEADER_ROW_BUSINESS, ...bodyRow];
              const result = await this.exportExcel(rawData, String(index));
              delete result.isProcess;
              await this.fileService.create(
                { ...result, type: FILE_TYPE.excel },
                currentUser,
              );
              return result;
            } catch (e) {
              throw new UnprocessableEntityException(e?.message);
            }
          };
        },
      );

      const result = await promisesSequentially(promiseExport, 10);
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async handleFindAllData(
    fetchDto: ExportBusinessDto,
    currentUser: UserEntity = null,
  ) {
    const { mode } = fetchDto;
    const isAdmin = currentUser?.role === ROLE.admin;
    const allLimit = await this.configService.get(EXPORT_ALL_LIMIT);
    try {
      let businessList = [];
      if (mode === EXPORT_MODE.all && isAdmin) {
        let hasMore = true;
        let cursor = null;
        let index = 0;
        while (hasMore) {
          const businessMore = await this.businessSerivce.findAllExport(
            { ...fetchDto, limit: allLimit },
            isAdmin,
            cursor,
          );
          if (businessMore.length === 1) hasMore = false;
          else {
            businessList = businessList.concat(businessMore);
            cursor = businessMore[businessMore.length - 1].id;
          }
          index++;
          console.log('cursor: ', index, cursor);
        }
      } else
        businessList = await this.businessSerivce.findAllExport(
          fetchDto,
          isAdmin,
        );
      return businessList;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async exportExcel(rawDatas: any, subName?: string) {
    try {
      const dir = await this.configService.get(ASSETS_CSV_DIR);
      const apiHost = await this.configService.get(API_HOST);
      const fileName = `EXPORT${subName ? `_${subName}` : ''}_${dayjs().format(
        'DD-MM-YYYY',
      )}_${Date.now().toString()}.csv`;
      const tempFilePath = `${dir}/${fileName}`;
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(rawDatas);

      XLSX.utils.book_append_sheet(workbook, worksheet, 'business');
      XLSX.writeFile(workbook, tempFilePath);

      return {
        isProcess: false,
        name: fileName,
        url: `${apiHost}assets/csv/${fileName}`,
        dirFile: dir,
      };
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
}
