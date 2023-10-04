export interface BullJob {
  jobId: string;
  userId: string;
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
