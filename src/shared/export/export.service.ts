/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import dayjs from 'dayjs';
import { API_HOST, ASSETS_CSV_DIR } from 'src/constants';
import * as XLSX from 'xlsx-js-style';

@Injectable()
export class ExportService {
  constructor(private configService: ConfigService) {}
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
