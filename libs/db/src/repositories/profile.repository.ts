import { EntityRepository } from '@mikro-orm/postgresql';
import { ProfileEntity } from '../entities/profile.entity';
import { UserEntity } from '../entities/user.entity';

export class ProfileRepository extends EntityRepository<ProfileEntity> {
  /**
   * Get user profile
   */
  async getUserProfile(user: UserEntity): Promise<ProfileEntity | null> {
    return await this.findOne({ user: { id: user.id } });
  }

  /**
   * Create or update user profile
   */
  // async createOrUpdateProfile(
  //   userId: number,
  //   profileData: {
  //     firstName?: string;
  //     lastName?: string;
  //     displayName?: string;
  //     avatarUrl?: string;
  //     bio?: string;
  //   },
  // ): Promise<ProfileEntity> {
  //   const user = await this.findOne({ id: userId });
  //   if (!user) {
  //     throw new Error('User not found');
  //   }

  //   let profile = await this.findOne({
  //     user: { id: userId },
  //   });

  //   if (profile) {
  //     this.assign(profile, profileData);
  //   } else {
  //     profile = this.create({
  //       ...profileData,
  //       user,
  //       createdAt: new Date(),
  //       updatedAt: new Date(),
  //     });
  //   }

  //   await this.em.persistAndFlush(profile);
  //   return profile;
  // }

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
    await this.em.persistAndFlush(profile);
    return profile;
  }
}
