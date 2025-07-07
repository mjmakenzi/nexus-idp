import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { AuditLogEntity } from './entities/audit-log.entity';
import { DeviceEntity } from './entities/device.entity';
import { OtpEntity } from './entities/otp.entity';
import { ProfileEntity } from './entities/profile.entity';
import { RevokedTokenEntity } from './entities/revoked-token.entity';
import { SessionEntity } from './entities/session.entity';
import { UserEntity } from './entities/user.entity';
import config from './mikro-orm.config';

@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forRootAsync({
      useFactory: (configService: ConfigService, logger: PinoLogger) => {
        console.log(config);
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
      UserEntity,
      ProfileEntity,
      AuditLogEntity,
      OtpEntity,
      RevokedTokenEntity,
      SessionEntity,
      DeviceEntity,
    ]),
  ],
  providers: [],
  exports: [MikroOrmModule],
})
export class DbModule {}
