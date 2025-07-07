import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { UserEntity } from './user.entity';

@Entity({ tableName: 'audit_logs', repository: () => AuditLogRepository })
export class AuditLogEntity extends BaseEntity {
  [EntityRepositoryType]?: AuditLogRepository;

  @PrimaryKey()
  id!: number;

  @ManyToOne({ fieldName: 'user_id' })
  user!: UserEntity;

  @Property({ fieldName: 'action' })
  action!: string;

  @Property({ fieldName: 'metadata', type: 'json' })
  metadata!: Record<string, any>;

  @Property({ fieldName: 'ip' })
  ip!: string;

  @Property({ fieldName: 'user_agent' })
  userAgent!: string;

  @Property({ fieldName: 'created_on' })
  createdOn!: Date;
}
