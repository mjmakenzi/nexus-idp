import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { DeviceRepository } from '../repositories/device.repository';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'devices', repository: () => DeviceRepository })
export class DeviceEntity extends BaseEntity {
  [EntityRepositoryType]?: DeviceRepository;

  @PrimaryKey()
  id!: number;

  @ManyToOne({ fieldName: 'user_id' })
  user!: UserEntity;

  @Property({ fieldName: 'device_id' })
  deviceId!: string;

  @Property({ fieldName: 'device_name', type: 'text', nullable: true })
  deviceName?: string;

  @Property({ fieldName: 'device_type', type: 'text', nullable: true })
  deviceType?: string;

  @Property({ fieldName: 'device_info', type: 'text', nullable: true })
  deviceInfo?: string;

  @Property({ fieldName: 'refresh_token', type: 'text', nullable: true })
  refreshToken?: string;

  @Property({ fieldName: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'ip', nullable: true })
  ip?: string;

  @Property({ fieldName: 'is_trusted', nullable: true })
  isTrusted?: boolean;

  @Property({ fieldName: 'last_activity', nullable: true })
  lastActivity?: Date;

  @Property({ fieldName: 'created_on' })
  createdOn!: Date;

  @Property({ fieldName: 'expired_on', nullable: true })
  expiredOn?: Date;

  @Property({ fieldName: 'terminated_on', nullable: true })
  terminatedOn?: Date;
}
