import { EntityRepository } from '@mikro-orm/postgresql';
import { ApiKeyEntity } from '../entities/api-key.entity';

export class ApiKeyRepository extends EntityRepository<ApiKeyEntity> {}
