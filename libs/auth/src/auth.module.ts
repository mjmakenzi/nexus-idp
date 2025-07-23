import { Module } from '@nestjs/common';
import { OtpEntity, SessionEntity } from '@app/db';
import { DevicesModule } from '@app/devices';
import { SecurityModule } from '@app/security';
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
import { SessionService } from './services/session/session.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([OtpEntity, SessionEntity]),
    UserModule,
    AppleModule,
    JwtModule,
    PassportModule,
    DiscourseModule,
    KavenegarModule,
    NodemailerModule,
    DevicesModule,
    SecurityModule,
  ],
  providers: [AuthService, OtpService, SessionService],
  exports: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
