import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { DeviceEntity, RevokedTokenEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AvatarModule } from '../avatar/avatar.module';
import { CommonModule } from '../common/common.module';
import { JwtService } from './jwt.service';

@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forFeature([DeviceEntity, RevokedTokenEntity]),
    CommonModule,
    AvatarModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [JwtService],
  exports: [JwtService, NestJwtModule],
})
export class JwtModule {}
