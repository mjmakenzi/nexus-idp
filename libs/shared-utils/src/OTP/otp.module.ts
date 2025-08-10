import { Module } from '@nestjs/common';
import { OtpEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OtpService } from './otp.service';

@Module({
  imports: [MikroOrmModule.forFeature([OtpEntity])],
  providers: [OtpService],
  exports: [OtpService],
})
export class OtpModule {}
