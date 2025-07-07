import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { UserEntity } from './user.entity';

@Entity({
  tableName: 'revoked_tokens',
  repository: () => RevokedTokenRepository,
})
export class RevokedTokenEntity extends BaseEntity {
  [EntityRepositoryType]?: RevokedTokenRepository;

  @PrimaryKey()
  id!: number;

  @ManyToOne({ fieldName: 'user_id' })
  user!: UserEntity;

  @Property({ fieldName: 'token', type: 'text' })
  token!: string;

  @Property({ fieldName: 'type' })
  type!: number;

  @Property({ fieldName: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Property({ fieldName: 'ip', nullable: true })
  ip?: string;

  @Property({ fieldName: 'expired_on' })
  expiredOn!: Date;

  @Property({ fieldName: 'revoked_on' })
  revokedOn!: Date;
}
