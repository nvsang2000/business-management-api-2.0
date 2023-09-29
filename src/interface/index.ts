import { UserEntity } from 'src/entities';
import { JobEntity } from 'src/entities/job.entity';

export interface JobAutoScratch {
  job: JobEntity;
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
