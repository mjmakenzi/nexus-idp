import { EntityRepository } from '@mikro-orm/postgresql';
import { ProfileEntity } from '../entities/profile.entity';
import { UserEntity } from '../entities/user.entity';

export class ProfileRepository extends EntityRepository<ProfileEntity> {
  async createProfile(
    user: UserEntity,
    data?: Partial<ProfileEntity>,
  ): Promise<ProfileEntity> {
    const profile = this.create({
      user,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return profile;
  }
}
