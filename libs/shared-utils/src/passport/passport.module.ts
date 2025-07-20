import { Module } from '@nestjs/common';
import { PassportModule as NestPassportModule } from '@nestjs/passport';
import { UserEntity } from '@app/db';
import { JwtModule } from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    NestPassportModule,
    JwtModule,
    MikroOrmModule.forFeature([UserEntity]),
  ],
  providers: [JwtStrategy],
  exports: [NestPassportModule],
})
export class PassportModule {}
