import { EntityRepository } from '@mikro-orm/postgresql';
import { ProfileEntity } from '../entities/profile.entity';
import { UserEntity } from '../entities/user.entity';

export class ProfileRepository extends EntityRepository<ProfileEntity> {
  async createProfile(user: UserEntity): Promise<ProfileEntity> {
    const profile = this.create({
      user,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return profile;
  }
}
