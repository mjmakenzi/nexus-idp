import {
  OneClickEmailDto,
  OneClickPhoneDto,
  SendOptEmailDto,
  SendOtpPhoneDto,
} from '@app/otp';
import { EntityRepository } from '@mikro-orm/postgresql';
import { UserEntity } from '../entities/user.entity';

export class UserRepository extends EntityRepository<UserEntity> {
  async createUser(
    dto: OneClickPhoneDto,
    username: string,
    passwordHash: string,
    passwordSalt: string,
  ): Promise<UserEntity> {
    const user = this.create({
      username,
      email: null,
      passwordHash,
      passwordSalt,
      countryCode: dto.country_code,
      phoneNo: dto.phone_no,
      phoneVerified: true,
      phoneVerifiedOn: new Date(),
      registeredOn: new Date(),
      emailVerified: false,
      identityVerified: false,
      failedLoginAttempts: 0,
      modifiedOn: new Date(),
      isDeleted: false,
    });

    return user;
  }

  async createEmailUser(
    email: string,
    username: string,
    passwordHash: string,
    passwordSalt: string,
  ): Promise<UserEntity> {
    const user = this.create({
      username,
      email,
      passwordHash,
      passwordSalt,
      countryCode: null,
      phoneNo: null,
      phoneVerified: false,
      registeredOn: new Date(),
      emailVerified: true,
      emailVerifiedOn: new Date(),
      identityVerified: false,
      failedLoginAttempts: 0,
      modifiedOn: new Date(),
      isDeleted: false,
    });

    return user;
  }

  async createGoogleUser(
    email: string,
    username: string,
    googleId: string,
    firstName?: string,
    lastName?: string,
    displayName?: string,
  ): Promise<UserEntity> {
    const user = this.create({
      username,
      email,
      googleId,
      passwordHash: null,
      passwordSalt: null,
      countryCode: null,
      phoneNo: null,
      phoneVerified: false,
      registeredOn: new Date(),
      emailVerified: true,
      emailVerifiedOn: new Date(),
      identityVerified: false,
      failedLoginAttempts: 0,
      modifiedOn: new Date(),
      isDeleted: false,
    });

    return user;
  }

  async getUserByPhone(
    dto: OneClickPhoneDto | SendOtpPhoneDto,
  ): Promise<UserEntity | null> {
    return await this.findOne({
      countryCode: dto.country_code,
      phoneNo: dto.phone_no,
      isDeleted: false,
    });
  }

  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.findOne({
      email,
      isDeleted: false,
    });
  }

  async getUserByGoogleId(googleId: string): Promise<UserEntity | null> {
    return await this.findOne({
      googleId,
      isDeleted: false,
    });
  }

  async getUserByAppleId(appleId: string): Promise<UserEntity | null> {
    return await this.findOne({
      appleId,
      isDeleted: false,
    });
  }
}
