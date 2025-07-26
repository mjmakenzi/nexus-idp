import { Injectable } from '@nestjs/common';
import { ProfileEntity, ProfileRepository, UserEntity } from '@app/db';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepo: ProfileRepository) {}

  async createProfile(user: UserEntity) {
    const createProfileDto: Partial<ProfileEntity> = {
      user: user,
    };
    return this.profileRepo.createProfile(createProfileDto);
  }

  async getProfile(user: UserEntity) {
    return this.profileRepo.getUserProfile(user);
  }
}
