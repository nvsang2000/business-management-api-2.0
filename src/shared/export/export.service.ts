/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import { ASSETS_CSV_DIR } from 'src/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExportService {
  constructor(private configService: ConfigService) {}
  async exportExcel(rawDatas: any) {
    try {
      const url = this.configService.get(ASSETS_CSV_DIR);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      worksheet.addRows(rawDatas);

      const fileName = `${uuidv4()}.csv`;

      const tempFilePath = `${url}/${fileName}`;
      await workbook.xlsx.writeFile(tempFilePath);

      return `/assets/csv/${fileName}`;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
}
