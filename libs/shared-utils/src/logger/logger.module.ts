import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LoggerService } from './logger.service';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
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
  ],
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
