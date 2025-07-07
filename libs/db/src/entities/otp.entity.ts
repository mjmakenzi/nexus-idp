import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { OtpRepository } from '../repositories/otp.repository';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'otps', repository: () => OtpRepository })
export class OtpEntity extends BaseEntity {
  [EntityRepositoryType]?: OtpRepository;

  @PrimaryKey()
  id!: number;

  @ManyToOne({ fieldName: 'user_id', nullable: true })
  user?: UserEntity;

  @Property({ fieldName: 'country_code', nullable: true })
  countryCode?: string;

  @Property({ fieldName: 'phone_no', nullable: true })
  phoneNo?: string;

  @Property({ fieldName: 'email', nullable: true })
  email?: string;

  @Property({ fieldName: 'otp' })
  otp!: string;

  @Property({ fieldName: 'action_type' })
  actionType!: string;

  @Property({ fieldName: 'step_no' })
  stepNo!: number;

  @Property({ fieldName: 'user_agent', nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'ip', nullable: true })
  ip?: string;

  @Property({ fieldName: 'created_on' })
  createdOn!: Date;

  @Property({ fieldName: 'expired_on' })
  expiredOn!: Date;
}
