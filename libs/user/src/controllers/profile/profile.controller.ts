import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserEntity } from '@app/db';
import { CurrentUser, JwtAuthGuard } from '@app/shared-utils';
import { ProfileService } from '../../services/profile/profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('v1/me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UserEntity) {
    console.log(user);
    return this.profileService.getProfile(user);
  }
}
