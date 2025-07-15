import { Module } from '@nestjs/common';
import {
  DeviceEntity,
  OtpEntity,
  ProfileEntity,
  RevokedTokenEntity,
  UserEntity,
} from '@app/db';
import {
  AppleModule,
  DiscourseModule,
  JwtModule,
  PassportModule,
} from '@app/shared-utils';
import { UserModule } from '@app/user';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      OtpEntity,
      UserEntity,
      ProfileEntity,
      RevokedTokenEntity,
      DeviceEntity,
    ]),
    UserModule,
    AppleModule,
    JwtModule,
    PassportModule,
    DiscourseModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
