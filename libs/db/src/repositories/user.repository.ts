import { CreateUserDto, findUserByPhoneDto } from '@app/user';
import { EntityRepository } from '@mikro-orm/postgresql';
import { UserEntity } from '../entities/user.entity';

export class UserRepository extends EntityRepository<UserEntity> {
  /**
   * Get user by email (excludes deleted users)
   */
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return await this.findOne({
      emailNormalized: normalizedEmail,
      deletedAt: null,
    });
  }

  /**
   * Get user by username (excludes deleted users)
   */
  async getUserByUsername(username: string): Promise<UserEntity | null> {
    return await this.findOne({
      username,
      deletedAt: null,
    });
  }

  /**
   * Get user by phone number (excludes deleted users)
   */
  async findUserByPhone(dto: findUserByPhoneDto): Promise<UserEntity | null> {
    return await this.findOne({
      countryCode: dto.countryCode,
      phoneNumber: dto.phoneNumber,
      deletedAt: null,
    });
  }

  /**
   * Get user by ID (excludes deleted users)
   */
  async getUserById(id: number): Promise<UserEntity | null> {
    return await this.findOne({
      id,
      deletedAt: null,
    });
  }

  /**
   * Get user by email including deleted users (for admin operations)
   */
  async getUserByEmailWithDeleted(email: string): Promise<UserEntity | null> {
    const normalizedEmail = email.toLowerCase().trim();
    return await this.findOne({ emailNormalized: normalizedEmail });
  }

  /**
   * Get user by ID including deleted users (for admin operations)
   */
  async getUserByIdWithDeleted(id: number): Promise<UserEntity | null> {
    return await this.findOne({ id });
  }

  /**
   * Create a new user
   */
  async createUser(dto: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.create(dto as UserEntity);

    await this.em.persistAndFlush(user);
    return user;
  }

  /**
   * Update user (excludes deleted users)
   */
  async updateUser(
    id: bigint,
    userData: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const user = await this.findOne({ id, deletedAt: null });
    if (!user) return null;

    this.assign(user, userData);
    await this.em.flush();
    return user;
  }

  // async createPhoneUser(
  //   dto: any,
  //   username: string,
  //   passwordHash: string,
  //   passwordSalt: string,
  // ): Promise<UserEntity> {
  //   const user = this.create({
  //     username,
  //     email: '',
  //     emailNormalized: '',
  //     passwordVersion: 0,
  //     mfaEnabled: false,
  //     status: 'active',
  //     passwordHash,
  //     passwordSalt,
  //     countryCode: dto.country_code,
  //     phoneNumber: dto.phone_no,
  //     phoneVerifiedAt: new Date(),
  //     emailVerifiedAt: null,
  //     identityVerifiedAt: null,
  //     failedLoginAttempts: 0,
  //     lastLoginAt: new Date(),
  //     deletedAt: null,
  //   });
  //   return user;
  // }
  // async createEmailUser(
  //   email: string,
  //   username: string,
  //   passwordHash: string,
  //   passwordSalt: string,
  // ): Promise<UserEntity> {
  //   const user = this.create({
  //     username,
  //     email,
  //     emailNormalized: email,
  //     passwordVersion: 0,
  //     mfaEnabled: false,
  //     status: 'active',
  //     passwordHash,
  //     passwordSalt,
  //     countryCode: null,
  //     phoneNumber: null,
  //     phoneVerifiedAt: null,
  //     emailVerifiedAt: new Date(),
  //     identityVerifiedAt: null,
  //     failedLoginAttempts: 0,
  //     lastLoginAt: new Date(),
  //     deletedAt: null,
  //   });
  //   return user;
  // }
  // async createGoogleUser(
  //   email: string,
  //   username: string,
  //   googleId: string,
  //   firstName?: string,
  //   lastName?: string,
  //   displayName?: string,
  // ): Promise<UserEntity> {
  //   const user = this.create({
  //     username,
  //     email,
  //     emailNormalized: email,
  //     passwordVersion: 0,
  //     mfaEnabled: false,
  //     status: 'active',
  //     passwordHash: null,
  //     passwordSalt: null,
  //     countryCode: null,
  //     phoneNumber: null,
  //     phoneVerifiedAt: null,
  //     emailVerifiedAt: new Date(),
  //     identityVerifiedAt: null,
  //     failedLoginAttempts: 0,
  //     lastLoginAt: new Date(),
  //     deletedAt: null,
  //   });
  //   return user;
  // }
  // async createAppleUser(
  //   email: string | undefined,
  //   username: string,
  //   appleId: string,
  //   displayName?: string,
  // ): Promise<UserEntity> {
  //   const user = this.create({
  //     username,
  //     email: email || '',
  //     emailNormalized: email || '',
  //     passwordVersion: 0,
  //     mfaEnabled: false,
  //     status: 'active',
  //     passwordHash: null,
  //     passwordSalt: null,
  //     countryCode: null,
  //     phoneNumber: null,
  //     phoneVerifiedAt: null,
  //     emailVerifiedAt: email ? new Date() : null,
  //     identityVerifiedAt: null,
  //     failedLoginAttempts: 0,
  //     lastLoginAt: new Date(),
  //     deletedAt: null,
  //   });
  //   return user;
  // }
  // async getUserByPhone(dto: any): Promise<UserEntity | null> {
  //   return await this.findOne({
  //     countryCode: dto.country_code,
  //     phoneNumber: dto.phone_no,
  //     deletedAt: null,
  //   });
  // }
  // async getUserByEmail(email: string): Promise<UserEntity | null> {
  //   return await this.findOne({
  //     email,
  //     deletedAt: null,
  //   });
  // }
  // async getUserByGoogleId(googleId: string): Promise<UserEntity | null> {
  //   return await this.findOne({
  //     federatedIdentities: {
  //       $some: {
  //         provider: 'google',
  //         providerUserId: googleId,
  //       },
  //     },
  //     deletedAt: null,
  //   });
  // }
  // async getUserByAppleId(appleId: string): Promise<UserEntity | null> {
  //   return await this.findOne({
  //     federatedIdentities: {
  //       $some: {
  //         provider: 'apple',
  //         providerUserId: appleId,
  //       },
  //     },
  //     deletedAt: null,
  //   });
  // }
}
