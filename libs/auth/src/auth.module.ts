import { Module } from '@nestjs/common';
import { ProfileEntity, UserEntity } from '@app/db';
import { CommonModule, JwtModule } from '@app/shared-utils';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AuthService } from './auth.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity, ProfileEntity]),
    JwtModule,
    CommonModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
