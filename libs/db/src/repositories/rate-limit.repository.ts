import { EntityRepository } from '@mikro-orm/postgresql';
import { RateLimitEntity } from '../entities/rate-limit.entity';

export class RateLimitRepository extends EntityRepository<RateLimitEntity> {}
