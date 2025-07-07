import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '@app/auth';
import { DbModule } from '@app/db';
import { OtpModule } from '@app/otp';
import {
  avatarConfig,
  discourseConfig,
  jwtConfig,
  kavenegarConfig,
  nodemailerConfig,
  rcaptchaConfig,
  RcaptchaModule,
} from '@app/shared-utils';
import { combinedValidationSchema } from '@app/shared-utils';
import { LoggerModule } from '@app/shared-utils';
import { resolve } from 'path';
import { apiConfig } from './api.config';
import { ApiController } from './api.controller';
import { apiSchema } from './api.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '.env'),
      load: [
        apiConfig,
        jwtConfig,
        discourseConfig,
        avatarConfig,
        kavenegarConfig,
        nodemailerConfig,
        rcaptchaConfig,
      ],
      validationSchema: apiSchema.concat(combinedValidationSchema),
    }),
    LoggerModule,
    JwtModule.register({ global: true }),
    DbModule,
    AuthModule,
    OtpModule,
    RcaptchaModule,
  ],
  controllers: [ApiController],
})
export class ApiModule {}
