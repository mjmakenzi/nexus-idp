import { UserEntity } from '@app/db';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @IsNotEmpty()
  user!: UserEntity;

  @IsNotEmpty()
  deviceFingerprint!: string;

  @IsNotEmpty()
  deviceType!: string;

  @IsOptional()
  deviceName?: string;

  @IsOptional()
  osName?: string;

  @IsOptional()
  osVersion?: string;

  @IsOptional()
  browserName?: string;

  @IsOptional()
  browserVersion?: string;

  @IsOptional()
  userAgent?: string;

  @IsOptional()
  lastIpAddress?: string;

  @IsOptional()
  isTrusted?: boolean;
}
