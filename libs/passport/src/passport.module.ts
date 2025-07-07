import { Module } from '@nestjs/common';
import { PassportModule as NestPassportModule } from '@nestjs/passport';
import { JwtModule } from '@app/shared-utils';
import { PassportService } from './passport.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [NestPassportModule, JwtModule],
  providers: [PassportService, JwtStrategy],
  exports: [PassportService, NestPassportModule],
})
export class PassportModule {}
