import { EntityRepository } from '@mikro-orm/postgresql';
import { SecurityEventEntity } from '../entities/security-event.entity';

export class SecurityEventRepository extends EntityRepository<SecurityEventEntity> {}
