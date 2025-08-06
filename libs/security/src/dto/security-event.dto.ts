import { SessionEntity, Severity } from '@app/db';
import { UserEntity } from '@app/db';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { FastifyRequest } from 'fastify';

export class CreateSecurityEventDto {
  @IsOptional()
  user?: UserEntity | null;

  @IsNotEmpty()
  req!: FastifyRequest;

  @IsOptional()
  session?: SessionEntity | null;

  @IsNotEmpty()
  eventType!: string;

  @IsNotEmpty()
  eventCategory!: string;

  @IsNotEmpty()
  severity!: Severity;
}
