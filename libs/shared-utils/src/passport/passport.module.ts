import { Module } from '@nestjs/common';
import { PassportModule as NestPassportModule } from '@nestjs/passport';
import { JwtModule } from '@app/shared-utils';
import { RevokedTokenModule } from '../revoked-token/revoked-token.module';
import { SessionModule } from '../session/session.module';
import { JwtRefreshStrategy } from './strategies/jwt.refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [NestPassportModule, JwtModule, RevokedTokenModule, SessionModule],
  providers: [JwtStrategy, JwtRefreshStrategy],
  exports: [NestPassportModule, JwtStrategy, JwtRefreshStrategy],
})
export class PassportModule {}
