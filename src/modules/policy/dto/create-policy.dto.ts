import { ACTION } from 'src/constants';
import {
  BooleanFieldOptional,
  EnumField,
  ObjectField,
  StringField,
} from 'src/decorators';

export class Permission {
  @EnumField(() => ACTION)
  action: ACTION;

  @StringField({})
  subject: string;

  constructor(partial: Partial<Permission>) {
    Object.assign(this, partial);
  }
}

export class CreatePolicyDto {
  @StringField({ allowEmpty: false })
  name: string;

  @ObjectField(Permission, { each: true })
  permissions: Permission[];

  @BooleanFieldOptional({})
  isActive?: boolean;
}
