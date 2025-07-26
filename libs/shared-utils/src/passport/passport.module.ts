import { Module } from '@nestjs/common';
import { PassportModule as NestPassportModule } from '@nestjs/passport';
import { SessionEntity, UserEntity } from '@app/db';
import { JwtModule } from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtRefreshStrategy } from './strategies/jwt.refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    NestPassportModule,
    JwtModule,
    MikroOrmModule.forFeature([UserEntity, SessionEntity]),
  ],
  providers: [JwtStrategy, JwtRefreshStrategy],
  exports: [NestPassportModule],
})
export class PassportModule {}
