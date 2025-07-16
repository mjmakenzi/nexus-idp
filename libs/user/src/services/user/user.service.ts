import { Injectable } from '@nestjs/common';
import {
  ProfileEntity,
  ProfileRepository,
  UserEntity,
  UserRepository,
} from '@app/db';
import { EntityManager } from '@mikro-orm/postgresql';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly em: EntityManager,
  ) {}

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ id });
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ email });
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({ username });
  }

  /**
   * Get user by phone number
   */
  async getUserByPhone(
    countryCode: string,
    phoneNumber: string,
  ): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      countryCode,
      phoneNumber,
    });
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    username: string;
    email: string;
    emailNormalized: string;
    passwordHash?: string;
    passwordSalt?: string;
    phoneNumber?: string;
    countryCode?: string;
  }): Promise<UserEntity> {
    const user = this.userRepository.create({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.em.persistAndFlush(user);
    return user;
  }

  /**
   * Update user
   */
  async updateUser(
    id: number,
    userData: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    const user = await this.userRepository.findOne({ id });
    if (!user) return null;

    this.userRepository.assign(user, userData);
    await this.em.flush();
    return user;
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: number): Promise<ProfileEntity | null> {
    return await this.profileRepository.findOne({ user: { id: userId } });
  }

  /**
   * Create or update user profile
   */
  async createOrUpdateProfile(
    userId: number,
    profileData: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatarUrl?: string;
      bio?: string;
    },
  ): Promise<ProfileEntity> {
    const user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    let profile = await this.profileRepository.findOne({
      user: { id: userId },
    });

    if (profile) {
      this.profileRepository.assign(profile, profileData);
    } else {
      profile = this.profileRepository.create({
        ...profileData,
        user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await this.em.persistAndFlush(profile);
    return profile;
  }
}
