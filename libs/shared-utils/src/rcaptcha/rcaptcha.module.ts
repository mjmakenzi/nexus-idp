import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RcaptchaGuard } from './rcaptcha.guard';
import { RcaptchaService } from './rcaptcha.service';

@Module({
  imports: [ConfigModule],
  providers: [RcaptchaService, RcaptchaGuard],
  exports: [RcaptchaService, RcaptchaGuard],
})
export class RcaptchaModule {}
