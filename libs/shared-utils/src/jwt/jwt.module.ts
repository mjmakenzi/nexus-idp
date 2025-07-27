import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { AvatarModule } from '../avatar/avatar.module';
import { CommonModule } from '../common/common.module';
import { JwtService } from './jwt.service';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    AvatarModule,
    // NestJwtModule.registerAsync({
    //   imports: [ConfigModule],
    //   useFactory: (config: ConfigService) => ({
    //     secret: config.getOrThrow<string>('jwt.secret'),
    //     signOptions: {
    //       expiresIn: config.getOrThrow<string>('jwt.expiresIn'),
    //       issuer: config.getOrThrow<string>('jwt.iss'),
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
    NestJwtModule,
  ],
  providers: [JwtService],
  exports: [JwtService, NestJwtModule],
})
export class JwtModule {}
