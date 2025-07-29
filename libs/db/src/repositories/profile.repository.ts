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

  /** Get user Profile with only user's email and phone number (returns plain object) */
  async getProfileWithUserRelations(user: UserEntity): Promise<
    | (Pick<
        ProfileEntity,
        | 'id'
        | 'firstName'
        | 'lastName'
        | 'displayname'
        | 'avatarUrl'
        | 'bio'
        | 'createdAt'
        | 'updatedAt'
      > & {
        email: string | undefined;
        phoneNumber: string | undefined;
        firstName: string | undefined;
        lastName: string | undefined;
        displayname: string | undefined;
        avatarUrl: string | undefined;
        bio: string | undefined;
        createdAt: Date | undefined;
        updatedAt: Date | undefined;
      })
    | null
  > {
    const result = await this.findOne(
      { user: { id: user.id } },
      {
        populate: ['user'],
        fields: [
          'id',
          'user.email',
          'user.phoneNumber',
          'firstName',
          'lastName',
          'displayname',
          'avatarUrl',
          'bio',
          'createdAt',
          'updatedAt',
        ],
      },
    );
    if (!result) return null;
    // Return only the selected fields as a plain object, not as UserEntity
    return {
      id: result.id,
      email: result.user.email,
      phoneNumber: result.user.phoneNumber,
      firstName: result.firstName,
      lastName: result.lastName,
      displayname: result.displayname,
      avatarUrl: result.avatarUrl,
      bio: result.bio,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
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

  async createProfile(dto: Partial<ProfileEntity>): Promise<ProfileEntity> {
    const profile = this.create(dto as ProfileEntity);

    await this.em.persistAndFlush(profile);
    return profile;
  }
}
