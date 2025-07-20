import { Module } from '@nestjs/common';
import { ProfileEntity, UserEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProfileController } from './controllers/profile/profile.controller';
import { ProfileService } from './services/profile/profile.service';
import { UserService } from './services/user/user.service';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity, ProfileEntity])],
  providers: [UserService, ProfileService],
  exports: [UserService, MikroOrmModule],
  controllers: [ProfileController],
})
export class UserModule {}
