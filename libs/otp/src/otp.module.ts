import { Module } from '@nestjs/common';
import { OtpEntity, ProfileEntity, UserEntity } from '@app/db';
import {
  AvatarModule,
  CommonModule,
  DiscourseModule,
  JwtModule,
  KavenegarModule,
  NodemailerModule,
} from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OtpService } from './otp.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([OtpEntity, UserEntity, ProfileEntity]),
    AvatarModule,
    KavenegarModule,
    NodemailerModule,
    CommonModule,
    JwtModule,
    DiscourseModule,
  ],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
