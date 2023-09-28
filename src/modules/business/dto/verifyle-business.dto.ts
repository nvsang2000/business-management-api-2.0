import { BooleanFieldOptional, ObjectFieldOptional } from 'src/decorators';

export class IsVerifyleDto {
  @BooleanFieldOptional({})
  isVerifyDisplayName?: boolean;

  @BooleanFieldOptional({})
  isVerifyPhoneNumber?: boolean;

  @BooleanFieldOptional({})
  isVerifyAddress?: boolean;
}

export class VerifyleBusinessDto {
  @ObjectFieldOptional(IsVerifyleDto)
  isVerify?: any;
}
