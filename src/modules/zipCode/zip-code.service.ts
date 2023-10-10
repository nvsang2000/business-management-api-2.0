/*
https://docs.nestjs.com/providers#services
*/

import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ItemUniqueZipCode } from 'src/interface';
import * as fs from 'fs-extra';
import { FetchZipCodeDto } from './dto/fetch-zip-code.dto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ZipCodeService {
  constructor(private prisma: PrismaService) {}

  async findMany() {
    try {
      const result = await this.prisma.city.findMany({});
      return result;
    } catch (e) {}
  }

  async getCity(cityName: string, stateCode: string, zipCode: string) {
    try {
      const result = await this.prisma.city.findUnique({
        where: {
          cityName_stateCode_zipCode: {
            cityName,
            stateCode,
            zipCode,
          },
        },
      });
      return result;
    } catch (e) {
      console.log(e);
    }
  }

  async readFileZipCode(fetchDto?: FetchZipCodeDto) {
    try {
      const { stateCode, countyName } = fetchDto;
      const readFile = fs.readFileSync(
        'assets/json/zip_code_children.json',
        'utf-8',
      );
      const zipCodeJson = JSON.parse(readFile);
      const findAllStateCode = !stateCode && !countyName;
      const findAllCountry = stateCode && !countyName;
      const findAllZipCode = stateCode && countyName;

      let result = zipCodeJson;
      let stateList: any[];
      let countyList: any[];
      let zipCodeList: any[];

      if (stateCode && zipCodeJson[stateCode]) result = zipCodeJson[stateCode];

      if (countyName && result[countyName]) result = result[countyName];

      if (findAllStateCode) stateList = Object.keys(result);

      if (findAllCountry) countyList = Object.values(result);

      if (findAllZipCode)
        zipCodeList = [result]?.map((i: any) => i?.zipCodeList)?.flat(Infinity);

      return {
        stateCode,
        countyName,
        stateList,
        countyList,
        zipCodeList,
      };
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }

  async coverZipCodeCity() {
    const readFile = fs.readFileSync(
      'assets/json/unique_zip_code.json',
      'utf-8',
    );
    const zipCodeList = JSON.parse(readFile);

    const groupedCities = {};

    zipCodeList.forEach((item) => {
      const { cityName, zipCode, stateCode, countyName } = item;

      if (!groupedCities[cityName]) {
        groupedCities[cityName] = {
          stateCode,
          countyName,
          cityName,
          zipCode: [zipCode],
        };
      } else {
        groupedCities[cityName].zipCode.push(zipCode);
      }
    });

    const groupedCitiesArray = Object.values(groupedCities);
    return fs.writeFileSync(
      'assets/json/city_name.json',
      JSON.stringify(groupedCitiesArray, null, 2),
      'utf-8',
    );
  }
  async coverZipCodeTree() {
    try {
      const readFile = fs.readFileSync(
        'assets/json/unique_zip_code.json',
        'utf-8',
      );
      const zipCodeList = JSON.parse(readFile);
      const groupedData = {};

      zipCodeList.forEach((item: ItemUniqueZipCode) => {
        const { stateCode, countyName, zipCode } = item;
        if (!zipCode) throw new BadRequestException(`error`);

        if (!groupedData[stateCode]) groupedData[stateCode] = {};

        if (!groupedData[stateCode][countyName])
          groupedData[stateCode][countyName] = {
            countyName,
            zipCodeList: [],
          };

        groupedData[stateCode][countyName].zipCodeList.push(zipCode);
      });

      return fs.writeFileSync(
        'assets/json/zip_code_children.json',
        JSON.stringify(groupedData, null, 2),
        'utf-8',
      );
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
}
