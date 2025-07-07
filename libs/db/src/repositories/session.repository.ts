import { EntityRepository } from '@mikro-orm/postgresql';
import { SessionEntity } from '../entities/session.entity';

export class SessionRepository extends EntityRepository<SessionEntity> {}
