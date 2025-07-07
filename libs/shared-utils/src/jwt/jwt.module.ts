import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { JwtService } from './jwt.service';

@Module({
  imports: [
    ConfigModule,
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
      inject: [ConfigModule],
    }),
  ],
  providers: [JwtService],
  exports: [JwtService, NestJwtModule],
})
export class JwtModule {}
