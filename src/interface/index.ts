import { UserEntity } from 'src/entities';
import { ScratchEntity } from 'src/entities/scratch.entity';
import { CreateJobSearchBusinessDto } from 'src/modules/job/dto';

export interface JobAutoScratch {
  scratch: ScratchEntity;
  payload: CreateJobSearchBusinessDto;
  currentUser: UserEntity;
}

export interface JobReAutoScratch {
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

export interface EventDataProps {
  data?: {
    zipCode: string;
    totalCreate?: number;
    totalUpdate?: number;
  };
  errorMessage?: string;
}
