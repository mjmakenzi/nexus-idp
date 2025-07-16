import { Module } from '@nestjs/common';
import { UserEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ProfileEntity } from '../../db/src/entities/profile.entity';
import { ProfileRepository } from '../../db/src/repositories/profile.repository';
import { UserRepository } from '../../db/src/repositories/user.repository';
import { UserService } from './services/user/user.service';

@Module({
  imports: [],
  providers: [UserService, UserRepository, ProfileRepository],
  exports: [UserService, UserRepository, ProfileRepository, MikroOrmModule],
})
export class UserModule {}
