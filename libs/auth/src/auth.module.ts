import { Module } from '@nestjs/common';
import { OtpEntity, ProfileEntity, UserEntity } from '@app/db';
import {
  AppleModule,
  DiscourseModule,
  JwtModule,
  KavenegarModule,
  NodemailerModule,
  PassportModule,
} from '@app/shared-utils';
import { UserModule } from '@app/user';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './services/OTP/otp.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([OtpEntity]),
    UserModule,
    AppleModule,
    JwtModule,
    PassportModule,
    DiscourseModule,
    KavenegarModule,
    NodemailerModule,
  ],
  providers: [AuthService, OtpService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
