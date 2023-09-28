import { Exclude } from 'class-transformer';
import { PolicyEntity } from './policy.entity';

export class UserEntity {
  id: string;
  email: string;
  displayName?: string;
  phone: string;
  thumbnail?: string;
  role?: string;
  isActive?: boolean;
  policy?: PolicyEntity;
  createdAt?: Date;
  updatedAt?: Date;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
