import { Injectable } from '@nestjs/common';
import { ProfileEntity, ProfileRepository, UserEntity } from '@app/db';
import { CommonService } from '@app/shared-utils';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepo: ProfileRepository,
    private readonly commonService: CommonService,
  ) {}

  async createProfile(user: UserEntity) {
    const createProfileDto: Partial<ProfileEntity> = {
      user: user,
      userDataKey: this.commonService.generateRandomUserDataKey(),
    };
    return this.profileRepo.createProfile(createProfileDto);
  }

  async getProfile(user: UserEntity) {
    return this.profileRepo.getProfileWithUserRelations(user);
  }
}
