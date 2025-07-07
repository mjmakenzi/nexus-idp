import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { LoggerModule } from 'nestjs-pino';
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
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const prettify =
          !configService.getOrThrow<boolean>('isProduction') &&
          !configService.getOrThrow<boolean>('isTesting');
        return {
          pinoHttp: {
            level: configService.getOrThrow<string>('logLevel'),
            transport: prettify ? { target: 'pino-pretty' } : undefined,
          },
          forRoutes: [],
        };
      },
    }),
    JwtModule.register({ global: true }),
    DbModule,
    AuthModule,
    OtpModule,
    RcaptchaModule,
  ],
  controllers: [ApiController],
})
export class ApiModule {}
