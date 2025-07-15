import { Module } from '@nestjs/common';
import { PassportModule as NestPassportModule } from '@nestjs/passport';
import { JwtModule } from '@app/shared-utils';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [NestPassportModule, JwtModule],
  providers: [JwtStrategy],
  exports: [NestPassportModule],
})
export class PassportModule {}
