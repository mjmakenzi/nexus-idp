import { EntityRepository } from '@mikro-orm/postgresql';
import { UserEntity } from '../entities/user.entity';

export class UserRepository extends EntityRepository<UserEntity> {
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
