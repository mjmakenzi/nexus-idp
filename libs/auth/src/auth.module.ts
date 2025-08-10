import { Module } from '@nestjs/common';
import { DevicesModule } from '@app/devices';
import { SecurityModule } from '@app/security';
import {
  AppleModule,
  DiscourseModule,
  JwtModule,
  KavenegarModule,
  LoggerModule,
  NodemailerModule,
  OtpModule,
  PassportModule,
  RevokedTokenModule,
  SessionModule,
} from '@app/shared-utils';
import { UserModule } from '@app/user';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UserModule,
    AppleModule,
    JwtModule,
    PassportModule,
    RevokedTokenModule,
    SessionModule,
    OtpModule,
    DiscourseModule,
    KavenegarModule,
    NodemailerModule,
    DevicesModule,
    SecurityModule,
    LoggerModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
