import { IsDate, IsNotEmpty } from 'class-validator';

export class CreateSecurityEventDto {
  @IsNotEmpty()
  eventType!: string;

  @IsNotEmpty()
  eventCategory!: string;

  @IsNotEmpty()
  severity!: string;

  @IsNotEmpty()
  @IsDate()
  occurredAt!: Date;
}
