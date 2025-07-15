import { EntityRepository } from '@mikro-orm/postgresql';
import { UserRoleEntity } from '../entities/user-role.entity';

export class UserRoleRepository extends EntityRepository<UserRoleEntity> {}
