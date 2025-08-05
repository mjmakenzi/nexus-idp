import { SessionEntity, Severity } from '@app/db';
import { UserEntity } from '@app/db';
import { IsNotEmpty } from 'class-validator';
import { FastifyRequest } from 'fastify';

export class CreateSecurityEventDto {
  @IsNotEmpty()
  user!: UserEntity;

  @IsNotEmpty()
  req!: FastifyRequest;

  @IsNotEmpty()
  session!: SessionEntity;

  @IsNotEmpty()
  eventType!: string;

  @IsNotEmpty()
  eventCategory!: string;

  @IsNotEmpty()
  severity!: Severity;
}
