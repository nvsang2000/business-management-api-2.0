import { UserEntity } from 'src/entities';
import { ExportBusinessDto } from 'src/shared/export/dto/export-business.dto';

export interface BullJob {
  jobId: string;
  userId: string;
}

export interface BullExport {
  fetchDto: ExportBusinessDto;
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
