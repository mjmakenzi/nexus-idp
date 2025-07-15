import { EntityRepository } from '@mikro-orm/postgresql';
import { FederatedIdentityEntity } from '../entities/federated-identity.entity';

export class FederatedIdentityRepository extends EntityRepository<FederatedIdentityEntity> {}
