import { Module } from '@nestjs/common';
import { OtpEntity } from '@app/db';
import {
  AppleModule,
  DiscourseModule,
  JwtModule,
  PassportModule,
} from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([OtpEntity]),
    AppleModule,
    JwtModule,
    PassportModule,
    DiscourseModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
