import { DeviceEntity, SessionEntity, UserEntity } from '@app/db';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSecurityEventDto {
  @IsOptional()
  user?: UserEntity;

  @IsOptional()
  device?: DeviceEntity;

  @IsOptional()
  session?: SessionEntity;

  @IsNotEmpty()
  eventType!: string;

  @IsNotEmpty()
  eventCategory!: string;

  @IsNotEmpty()
  severity!: string;

  @IsOptional()
  riskScore?: string;

  @IsOptional()
  eventData?: Record<string, unknown>;
}
