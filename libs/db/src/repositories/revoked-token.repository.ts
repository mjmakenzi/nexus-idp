import { EntityRepository } from '@mikro-orm/postgresql';
import { RevokedTokenEntity } from '../entities/revoked-token.entity';

export class RevokedTokenRepository extends EntityRepository<RevokedTokenEntity> {}
