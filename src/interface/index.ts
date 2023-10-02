import { UserEntity } from 'src/entities';

export interface BullJob {
  jobId: string;
  currentUser: UserEntity;
}

export interface ItemUniqueZipCode {
  cityName: string;
  zipCode: string;
  countyName: string;
  stateName: string;
  stateCode: string;
}

export interface Payload {
  keyword: string;
  zipCode: string;
}
