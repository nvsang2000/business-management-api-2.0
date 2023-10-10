/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import { API_HOST, ASSETS_CSV_DIR } from 'src/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ExportService {
  constructor(private configService: ConfigService) {}
  async exportExcel(rawDatas: any) {
    try {
      const dir = await this.configService.get(ASSETS_CSV_DIR);
      const apiHost = await this.configService.get(API_HOST);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      worksheet.addRows(rawDatas);

      const fileName = `BUSINESS_${uuidv4()}.csv`;

      const tempFilePath = `${dir}/${fileName}`;
      await workbook.xlsx.writeFile(tempFilePath);

      return {
        name: fileName,
        url: `${apiHost}assets/csv/${fileName}`,
      };
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
}
