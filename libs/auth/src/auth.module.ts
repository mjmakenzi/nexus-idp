import { Module } from '@nestjs/common';
import { OtpEntity, UserEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthService } from './auth.service';

@Module({
  imports: [MikroOrmModule.forFeature([OtpEntity, UserEntity])],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
