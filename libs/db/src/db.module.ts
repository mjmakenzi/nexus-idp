import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AuditLogEntity } from './entities/audit-log.entity';
import { DeviceEntity } from './entities/device.entity';
import { OtpEntity } from './entities/otp.entity';
import { ProfileEntity } from './entities/profile.entity';
import { RateLimitEntity } from './entities/rate-limit.entity';
import { RevokedTokenEntity } from './entities/revoked-token.entity';
import { SecurityEventEntity } from './entities/security-event.entity';
import { SessionArchiveEntity } from './entities/session-archive.entity';
import { SessionEntity } from './entities/session.entity';
import { UserEntity } from './entities/user.entity';
import config from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forRootAsync({
      useFactory: (configService: ConfigService, logger: PinoLogger) => {
        logger.setContext(MikroOrmModule.name);
        return {
          ...config,
          logger: (message) => logger.debug(message),
        };
      },
      inject: [ConfigService, PinoLogger],
      driver: PostgreSqlDriver,
    }),
    MikroOrmModule.forFeature([
      OtpEntity,
      UserEntity,
      ProfileEntity,
      AuditLogEntity,
      RevokedTokenEntity,
      SessionEntity,
      DeviceEntity,
      RateLimitEntity,
      SecurityEventEntity,
      SessionArchiveEntity,
    ]),
  ],
  exports: [MikroOrmModule],
})
export class DbModule {}
