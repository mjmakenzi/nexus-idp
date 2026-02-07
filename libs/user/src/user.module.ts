import { Module } from '@nestjs/common';
import { ProfileEntity, UserEntity } from '@app/db';
import { SecurityModule } from '@app/security';
import { CommonModule, SessionModule } from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProfileController } from './controllers/profile/profile.controller';
import { AccountManagementService } from './services/account-management/account-management.service';
import { ProfileService } from './services/profile/profile.service';
import { UserService } from './services/user/user.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity, ProfileEntity]),
    CommonModule,
    SecurityModule,
    SessionModule,
  ],
  providers: [UserService, ProfileService, AccountManagementService],
  exports: [UserService, ProfileService, AccountManagementService],
  controllers: [ProfileController],
})
export class UserModule {}
