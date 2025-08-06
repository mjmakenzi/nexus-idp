import { Module } from '@nestjs/common';
import { ProfileEntity, UserEntity } from '@app/db';
import { CommonModule } from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProfileController } from './controllers/profile/profile.controller';
import { ProfileService } from './services/profile/profile.service';
import { UserService } from './services/user/user.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity, ProfileEntity]),
    CommonModule,
  ],
  providers: [UserService, ProfileService],
  exports: [UserService, ProfileService],
  controllers: [ProfileController],
})
export class UserModule {}
