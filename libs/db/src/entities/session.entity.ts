import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { SessionRepository } from '../repositories/session.repository';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'sessions', repository: () => SessionRepository })
export class SessionEntity extends BaseEntity {
  [EntityRepositoryType]?: SessionRepository;

  @PrimaryKey()
  id!: number;

  @Property({ fieldName: 'identifier_id' })
  identifierId!: string;

  @ManyToOne({ fieldName: 'user_id' })
  user!: UserEntity;

  @Property({ fieldName: 'access_token', type: 'text' })
  accessToken!: string;

  @Property({ fieldName: 'refresh_token', type: 'text' })
  refreshToken!: string;

  @Property({ fieldName: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'ip', nullable: true })
  ip?: string;

  @Property({ fieldName: 'scope', nullable: true })
  scope?: string;

  @Property({ fieldName: 'created_on' })
  createdOn!: Date;

  @Property({ fieldName: 'modified_on' })
  modifiedOn!: Date;

  @Property({ fieldName: 'expired_on' })
  expiredOn!: Date;
}
