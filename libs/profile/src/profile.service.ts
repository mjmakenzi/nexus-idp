import { Injectable } from '@nestjs/common';
import { GetUserProfileDto, UpdateUsernameDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  async updateUsername(dto: UpdateUsernameDto) {
    return {
      status: 'success',
      data: {
        message: 'Username updated successfully',
      },
    };
  }

  async getUserProfile(dto: GetUserProfileDto) {
    return {
      status: 'success',
      data: {
        message: 'User profile fetched successfully',
      },
    };
  }
}
