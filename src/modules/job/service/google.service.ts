/*
https://docs.nestjs.com/providers#services
*/

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { GOOGLE_MAP_URL } from 'src/constants';

@Injectable()
export class GoogleService {
  private axios: AxiosInstance;
  private baseUrl: string;
  constructor(
    private configService: ConfigService,
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
}
