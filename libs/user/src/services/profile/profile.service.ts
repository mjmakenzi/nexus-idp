import { Injectable } from '@nestjs/common';
import { UserEntity, UserRepository } from '@app/db';

@Injectable()
export class ProfileService {
  constructor(private readonly userRepo: UserRepository) {}

  async getProfile(user: UserEntity) {
    return this.userRepo.getUserById(user.id);
  }
}
