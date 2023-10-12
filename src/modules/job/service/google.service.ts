/*
https://docs.nestjs.com/providers#services
*/

import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_OPTION_HEADER_FETCH,
  FIELDS_BASIC_PLACE,
  FIELDS_DETAIL_PLACE,
  GOOGLE_API_INPUT_TYPE,
  GOOGLE_MAP_KEY,
  GOOGLE_MAP_URL,
  METHOD,
  WEBSITE,
} from 'src/constants';
import { UserEntity } from 'src/entities';
import { BusinessService } from 'src/modules/business/business.service';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { BullGoogleVerifyBasic } from 'src/interface';
import { formatPhoneNumber, parseAddress } from 'src/helper';
import { FetchVerifyDto } from '../dto';

interface ResultPlace {
  name: string;
  website: string;
  formatted_address: string;
  formatted_phone_number: string;
}

interface DetailPlace {
  html_attributions: any;
  result: ResultPlace;
  status: string;
}
@Injectable()
export class GoogleService {
  private baseUrl: string;
  private googleMapKey: string;
  constructor(
    private configService: ConfigService,
    private business: BusinessService,
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
      const businessList = await this.business.findManyGoogleVerify({
        ...payload,
      });
      for (const [index, business] of businessList.entries()) {
        const { id, address, city, state, zipCode, name, categories } =
          business;
        const currentAddress = `${address}, ${city}, ${state} ${zipCode}`;
        const textquery = GOOGLE_API_INPUT_TYPE.TEXT_QUERY;
        const input = `${name}, ${payload?.categories} in ${currentAddress}`;
        const result = await this.getPlaceId(input, textquery);
        console.log('inputValue', business, result, index, input);
        const { candidates } = result;
        if (candidates?.length === 1) {
          const { permanently_closed, place_id } = candidates?.[0];
          if (permanently_closed) await this.business.delete(id);
          else {
            const business = await this.business.findByGoogleMapId(place_id);
            if (!business) {
              const detailPlace = await this.getDetailPlaceId(place_id);
              const { result } = detailPlace as DetailPlace;
              const newPhone = result?.formatted_phone_number;
              if (newPhone) {
                const newAddress = result?.formatted_address?.replace(
                  /, United States/g,
                  '',
                );
                const { city, state, street, zipCode } =
                  parseAddress(newAddress);
                const phone = formatPhoneNumber(newPhone);
                const valueUpdate = {
                  city,
                  state,
                  zipCode,
                  phone,
                  address: street,
                  googleVerify: true,
                  website: result?.website,
                  name: result?.name,
                  googleMapId: place_id,
                };
                await this.business.update(id, valueUpdate, currentUser);
              }
            }
          }
        }
        if (candidates?.length > 1) {
          const totalUpdate = 0;
          for (const item of candidates) {
            const { permanently_closed, place_id } = item;
            if (!permanently_closed) {
              const business = await this.business.findByGoogleMapId(place_id);
              if (!business) {
                const detailPlace = await this.getDetailPlaceId(place_id);
                const { result } = detailPlace as DetailPlace;
                const newPhone = result?.formatted_phone_number;
                if (newPhone) {
                  const newAddress = result?.formatted_address?.replace(
                    /, United States/g,
                    '',
                  );
                  const { city, state, street, zipCode } =
                    parseAddress(newAddress);
                  const phone = formatPhoneNumber(newPhone);
                  const valueUpdate = {
                    city,
                    state,
                    zipCode,
                    phone,
                    address: street,
                    googleVerify: true,
                    website: result?.website,
                    name: result?.name,
                    googleMapId: place_id,
                    scratchLink: `${WEBSITE.GOOGLE.MAP_URL}:${place_id}`,
                  };
                  if (totalUpdate === 0)
                    await this.business.update(id, valueUpdate, currentUser);
                  else
                    await this.business.create(
                      { ...valueUpdate, categories },
                      currentUser,
                    );
                }
              }
            }
          }
        }
      }
    } catch (e) {
      throw new UnprocessableEntityException(e?.message);
    }
  }

  async getDetailPlaceId(placeId: string) {
    try {
      try {
        const url = `${this.baseUrl}details/json?fields=${FIELDS_DETAIL_PLACE}&place_id=${placeId}&key=${this.googleMapKey}`;
        const result = await fetch(url, {
          method: METHOD.GET,
          headers: DEFAULT_OPTION_HEADER_FETCH,
        }).then((response: Response) => response.json());

        return result;
      } catch (e) {
        console.log(e);
      }
    } catch (e) {}
  }

  async getPlaceId(input: string, inputtype: string) {
    try {
      const url = `${this.baseUrl}findplacefromtext/json?input=${input}&inputtype=${inputtype}&fields=${FIELDS_BASIC_PLACE}&key=${this.googleMapKey}`;
      const result = await fetch(url, {
        method: METHOD.GET,
        headers: DEFAULT_OPTION_HEADER_FETCH,
      }).then((response: Response) => response.json());

      return result;
    } catch (e) {
      console.log(e);
    }
  }
}
