import { EntityRepository } from '@mikro-orm/postgresql';
import { RoleEntity } from '../entities/role.entity';

export class RoleRepository extends EntityRepository<RoleEntity> {}
