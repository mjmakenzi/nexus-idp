import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@app/auth';
import { AuthController } from '@app/auth';
import { DbModule } from '@app/db';
import {
  appleConfig,
  avatarConfig,
  discourseConfig,
  jwtConfig,
  kavenegarConfig,
  nodemailerConfig,
  rcaptchaConfig,
  sessionConfig,
} from '@app/shared-utils';
import { combinedValidationSchema } from '@app/shared-utils';
import { LoggerModule } from '@app/shared-utils';
import { UserModule } from '@app/user';
import { resolve } from 'path';
import { apiConfig } from './api.config';
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
        appleConfig,
        sessionConfig,
      ],
      validationSchema: apiSchema.concat(combinedValidationSchema),
    }),
    LoggerModule,
    DbModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AuthController],
})
export class ApiModule {}
