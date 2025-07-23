import { DeviceEntity } from '@app/db';
import { UserEntity } from '@app/db';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  user!: UserEntity;

  @IsOptional()
  device?: DeviceEntity;

  @IsOptional()
  ipAddress?: string;

  @IsOptional()
  userAgent?: string;

  @IsOptional()
  accessTokenHash?: string;

  @IsOptional()
  refreshTokenHash?: string;
}
