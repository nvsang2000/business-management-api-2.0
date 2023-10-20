/*
https://docs.nestjs.com/providers#services
*/

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ASSETS_CSV_DIR } from 'src/constants';
import * as XLSX from 'xlsx-js-style';

@Injectable()
export class ImportService {
  constructor(private configService: ConfigService) {}
  async importBusiness() {
    try {
      const dir = await this.configService.get(ASSETS_CSV_DIR);

      const dirFile = `${dir}/BUSINESS_20-10-2023_1697776112992.csv`;

      const file = this.readCSV(dirFile);
      console.log('file', file);
    } catch (e) {}
  }

  async readCSV(filePath) {
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
