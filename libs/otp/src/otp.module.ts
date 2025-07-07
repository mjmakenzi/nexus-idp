import { Module } from '@nestjs/common';
import { OtpEntity, ProfileEntity, UserEntity } from '@app/db';
import {
  AvatarModule,
  CommonService,
  DiscourseService,
  JwtService,
  KavenegarModule,
  KavenegarService,
  NodemailerModule,
  NodemailerService,
} from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OtpService } from './otp.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([OtpEntity, UserEntity, ProfileEntity]),
    AvatarModule,
    KavenegarModule,
    NodemailerModule,
  ],
  providers: [
    OtpService,
    JwtService,
    DiscourseService,
    NodemailerService,
    KavenegarService,
    CommonService,
  ],
  exports: [OtpService],
})
export class OtpModule {}
