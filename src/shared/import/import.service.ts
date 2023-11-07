/*
https://docs.nestjs.com/providers#services
*/

import { InjectQueue } from '@nestjs/bull';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import dayjs from 'dayjs';
import { API_HOST, ASSETS_CSV_DIR, FILE_TYPE } from 'src/constants';
import { UserEntity } from 'src/entities';
import { BusinessService } from 'src/modules/business/business.service';
import { CreateFileDto } from 'src/modules/files/dto';
import { FilesService } from 'src/modules/files/files.service';
import * as XLSX from 'xlsx-js-style';
import * as fs from 'fs';
import { promisesSequentially } from 'src/helper';
import { ImportBusinessDto } from './dto/import-business.dto';
@Injectable()
export class ImportService {
  constructor(
    private configService: ConfigService,
    private fileService: FilesService,
    private businessSerivce: BusinessService,
    @InjectQueue(`import-queue-${process.env.REDIS_SERVER}`)
    private importQueue: Queue,
  ) {}
  async createImportBusiness(
    file: Express.Multer.File,
    payload: ImportBusinessDto,
    currentUser: UserEntity,
  ) {
    try {
      const dir = await this.configService.get(ASSETS_CSV_DIR);
      const apiHost = await this.configService.get(API_HOST);
      const fileName = `IMPORT_${dayjs().format(
        'DD-MM-YYYY',
      )}_${Date.now().toString()}.csv`;
      const url = `${apiHost}assets/csv/${fileName}`;
      fs.writeFileSync(`${dir}/${fileName}`, file.buffer);

      const newFile: CreateFileDto = {
        url,
        name: fileName,
        type: FILE_TYPE.excel,
        dirFile: dir,
      };
      await this.importQueue.add(
        'import-business',
        { file: newFile, payload },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 0,
        },
      );
      const result = await this.fileService.create(newFile, currentUser);
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async runImportBusiness(bull: Job<any>) {
    const { file, payload } = bull.data;
    const dir = await this.configService.get(ASSETS_CSV_DIR);
    const dirFile = `${dir}/${file.name}`;
    try {
      const businessList = await this.readCSV(dirFile);
      const promises = businessList?.map((business) => {
        return async () => {
          delete business?.id;
          const newBusiness = {
            ...business,
            name: String(business?.name),
            phone: business?.phone?.replace(/"/g, ''),
            zipCode: business?.zipCode?.replace(/"/g, ''),
            address: String(business?.address),
            categories: business?.categories?.split(', '),
          };
          return await this.businessSerivce.saveScratchBusiness(newBusiness);
        };
      });
      console.log('promises: ', promises?.length, payload);
      const result = await promisesSequentially(promises, payload?.limit);
      console.log('promises end!');
      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async readCSV(filePath: string) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref']);

    const data = [];

    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellHeader = XLSX.utils.encode_cell({ c: col, r: range.s.r });
      headers.push(worksheet[cellHeader].v);
    }

    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const rowData = {};
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
        const cellValue = worksheet[cellAddress]
          ? worksheet[cellAddress].v
          : undefined;
        const cellHeader = headers[col];
        rowData[cellHeader] = cellValue;
      }
      data.push(rowData);
    }

    return data;
  }
}
