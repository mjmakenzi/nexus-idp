import { EntityRepository } from '@mikro-orm/postgresql';
import { AuditLogEntity } from '../entities/audit-log.entity';

export class AuditLogRepository extends EntityRepository<AuditLogEntity> {}
