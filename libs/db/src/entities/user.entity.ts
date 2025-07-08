import {
  BaseEntity,
  Collection,
  Entity,
  EntityRepositoryType,
  OneToMany,
  OneToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { UserRepository } from '../repositories/user.repository';
import { AuditLogEntity } from './audit-log.entity';
import { DeviceEntity } from './device.entity';
import { OtpEntity } from './otp.entity';
import { ProfileEntity } from './profile.entity';
import { RevokedTokenEntity } from './revoked-token.entity';
import { SessionEntity } from './session.entity';

@Entity({ tableName: 'users', repository: () => UserRepository })
export class UserEntity extends BaseEntity {
  [EntityRepositoryType]?: UserRepository;

  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'username', unique: true })
  username!: string;

  @Property({ fieldName: 'email', nullable: true, unique: true })
  email?: string;

  @Property({ fieldName: 'phone_no', nullable: true, unique: true })
  phoneNo?: string;

  @Property({ fieldName: 'password_hash', nullable: true })
  passwordHash?: string;

  @Property({ fieldName: 'password_salt', nullable: true })
  passwordSalt?: string;

  @Property({ fieldName: 'country_code', nullable: true })
  countryCode?: string;

  @Property({ fieldName: 'google_id', nullable: true, unique: true })
  googleId?: string;

  @Property({ fieldName: 'apple_id', nullable: true, unique: true })
  appleId?: string;

  @Property({ fieldName: 'email_verified', default: false })
  emailVerified: boolean = false;

  @Property({ fieldName: 'email_verified_on', nullable: true })
  emailVerifiedOn?: Date;

  @Property({ fieldName: 'phone_verified', default: false })
  phoneVerified: boolean = false;

  @Property({ fieldName: 'phone_verified_on', nullable: true })
  phoneVerifiedOn?: Date;

  @Property({ fieldName: 'identity_verified', default: false })
  identityVerified: boolean = false;

  @Property({ fieldName: 'identity_verified_on', nullable: true })
  identityVerifiedOn?: Date;

  @Property({ fieldName: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number = 0;

  @Property({ fieldName: 'locked_until', nullable: true })
  lockedUntil?: Date;

  @Property({ fieldName: 'registered_on' })
  registeredOn: Date = new Date();

  @Property({ fieldName: 'modified_on', onUpdate: () => new Date() })
  modifiedOn: Date = new Date();

  @Property({ fieldName: 'is_deleted', default: false })
  isDeleted: boolean = false;

  @OneToOne(() => ProfileEntity, (profile) => profile.user, { nullable: true })
  profile?: ProfileEntity;

  @OneToMany(() => SessionEntity, (s) => s.user)
  sessions = new Collection<SessionEntity>(this);

  @OneToMany(() => DeviceEntity, (d) => d.user)
  devices = new Collection<DeviceEntity>(this);

  @OneToMany(() => RevokedTokenEntity, (r) => r.user)
  revokedTokens = new Collection<RevokedTokenEntity>(this);

  @OneToMany(() => OtpEntity, (o) => o.user)
  otps = new Collection<OtpEntity>(this);

  @OneToMany(() => AuditLogEntity, (a) => a.user)
  auditLogs = new Collection<AuditLogEntity>(this);
}
