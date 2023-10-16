import { UserEntity } from 'src/entities';
import { FetchVerifyDto } from 'src/modules/job/dto';
export interface BullJob {
  jobId: string;
  userId: string;
}

export interface BullJobVerify {
  fetchDto: FetchVerifyDto;
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
