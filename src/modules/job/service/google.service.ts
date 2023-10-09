/*
https://docs.nestjs.com/providers#services
*/

import { HttpService } from '@nestjs/axios';
import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { PrismaService } from 'nestjs-prisma';
import { GOOGLE_MAP_URL } from 'src/constants';
import { BusinessEntity } from 'src/entities';
import { parseAddress } from 'src/helper';
import { BusinessService } from 'src/modules/business/business.service';
import { LimitVerifyDto } from '../dto/limit-verify.dto';

@Injectable()
export class GoogleService {
  private axios: AxiosInstance;
  private baseUrl: string;
  constructor(
    private configService: ConfigService,
    private businessService: BusinessService,
    private prisma: PrismaService,
    private httpService: HttpService,
  ) {}

  public async onModuleInit(): Promise<any> {
    this.baseUrl = this.configService.get(GOOGLE_MAP_URL);
    this.axios = this.httpService.axiosRef as unknown as AxiosInstance;
  }

  async request(config: AxiosRequestConfig) {
    const axiosConfig = { ...config, url: `${this.baseUrl}${config.url}` };
    return this.axios.request(axiosConfig);
  }

  async verifyGoogleBasic(payload: LimitVerifyDto) {
    try {
      const fields =
        'formatted_address%2Cname%2Cpermanently_closed%2Ctypes%2Cplace_id';
      const key = 'AIzaSyANZf_3Y_6YFizSpYe3v_XegrSNcWfxhoI';
      const businessList = await this.prisma.business.findMany({
        where: { googleVerify: false },
        take: +payload.limit,
      });
      for (const business of businessList) {
        const { id, name, address, city, state, zipCode } = business;
        const currentAddress = `${address}, ${city}, ${state} ${zipCode}`;
        const inputValue = `${name} in ${currentAddress}`;

        const result = await this.request({
          method: 'get',
          url: `findplacefromtext/json?input=${inputValue}&inputtype=textquery&fields=${fields}&key=${key}`,
        }).then((res) => res.data);

        console.log('inputValue', business, result?.candidates);
        const { candidates } = result;
        let replaceAddress: string;
        let valueUpdate: BusinessEntity;
        if (candidates?.length === 0) await this.businessService.delete(id);
        if (candidates?.length === 1) {
          if (candidates?.[0]?.permanently_closed)
            await this.businessService.delete(id);
          else {
            replaceAddress = candidates?.[0]?.formatted_address?.replace(
              /, United States/g,
              '',
            );
            const { city, state, street, zip } = parseAddress(replaceAddress);
            valueUpdate = {
              ...(currentAddress !== replaceAddress && {
                city,
                state,
                zipCode: zip,
                address: street,
              }),
              googleVerify: true,
              name: candidates?.[0]?.name,
              googleMapId: candidates?.[0]?.place_id,
            };
            await this.prisma.business.update({
              where: { id },
              data: valueUpdate,
            });
          }
        }
        if (candidates?.length > 1) {
          let totalUpdate = 0;
          for (const item of candidates) {
            replaceAddress = item?.formatted_address?.replace(
              /, United States/g,
              '',
            );
            if (currentAddress === replaceAddress) {
              if (item?.permanently_closed)
                await this.businessService.delete(id);
              else {
                valueUpdate = {
                  googleVerify: true,
                  name: item?.name,
                  googleMapId: item?.place_id,
                };
                totalUpdate++;
                await this.prisma.business.update({
                  where: { id },
                  data: valueUpdate,
                });
              }
            }
          }
          if (totalUpdate === 0) await this.businessService.delete(id);
        }
      }
    } catch (e) {
      throw new UnprocessableEntityException(e?.response?.data);
    }
  }
}
