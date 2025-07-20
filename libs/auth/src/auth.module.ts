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
import { OtpController } from './controllers/OTP/otp.controller';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/OTP/otp.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([OtpEntity, UserEntity, ProfileEntity]),
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
  controllers: [OtpController],
})
export class AuthModule {}
