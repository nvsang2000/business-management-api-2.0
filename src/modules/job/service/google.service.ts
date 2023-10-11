/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_OPTION_HEADER_FETCH,
  FIELDS_BASIC_PLACE,
  GOOGLE_MAP_KEY,
  GOOGLE_MAP_URL,
  METHOD,
} from 'src/constants';
import { BusinessEntity, UserEntity } from 'src/entities';
import { BusinessService } from 'src/modules/business/business.service';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { BullGoogleVerifyBasic } from 'src/interface';
import { parseAddress } from 'src/helper';
import { FetchVerifyDto } from '../dto';

@Injectable()
export class GoogleService {
  private baseUrl: string;
  private googleMapKey: string;
  constructor(
    private configService: ConfigService,
    private businessService: BusinessService,
    @InjectQueue('job-queue')
    private scrapingQueue: Queue,
  ) {}

  public async onModuleInit(): Promise<any> {
    this.baseUrl = this.configService.get(GOOGLE_MAP_URL);
    this.googleMapKey = this.configService.get(GOOGLE_MAP_KEY);
  }

  async createJob(payload: FetchVerifyDto, currentUser: UserEntity) {
    try {
      const result = await this.scrapingQueue.add(
        'google-verify-basic',
        { payload, currentUser },
        {
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 0,
        },
      );

      return result;
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async verifyGoogleBasic(bull: Job<BullGoogleVerifyBasic>) {
    const { currentUser, payload } = bull.data;

    try {
      const businessList = await this.businessService.findManyGoogleVerify({
        ...payload,
      });
      for (const [index, business] of businessList.entries()) {
        const { id, name, address, city, state, zipCode } = business;
        const currentAddress = `${address}, ${city}, ${state} ${zipCode}`;
        const input = `${name} in ${currentAddress}`;
        const url = `${this.baseUrl}findplacefromtext/json?input=${input}&inputtype=textquery&fields=${FIELDS_BASIC_PLACE}&key=${this.googleMapKey}`;

        const result = await fetch(url, {
          method: METHOD.GET,
          headers: DEFAULT_OPTION_HEADER_FETCH,
        }).then((response: Response) => response.json());

        console.log('inputValue', business, result, index);
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
            const { city, state, street, zipCode } =
              parseAddress(replaceAddress);

            console.log('address', city, state, street, zipCode);
            valueUpdate = {
              city,
              state,
              zipCode,
              address: street,
              googleVerify: true,
              name: candidates?.[0]?.name,
              googleMapId: candidates?.[0]?.place_id,
            };
            await this.businessService.update(id, valueUpdate, currentUser);
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
                await this.businessService.update(id, valueUpdate, currentUser);
              }
            }
          }
          if (totalUpdate === 0) await this.businessService.delete(id);
        }
      }
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }
}
