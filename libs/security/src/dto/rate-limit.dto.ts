import { RateLimitScope } from '@app/db';
import { IsNotEmpty } from 'class-validator';

export class CreateRateLimitDto {
  @IsNotEmpty()
  identifier!: string;

  @IsNotEmpty()
  limitType!: string;

  @IsNotEmpty()
  scope!: RateLimitScope;

  @IsNotEmpty()
  attempts!: number;

  @IsNotEmpty()
  maxAttempts!: number;

  @IsNotEmpty()
  windowStart!: Date;

  @IsNotEmpty()
  windowEnd!: Date;

  @IsNotEmpty()
  windowSeconds!: number;
}

export class FindRateLimitDto {
  @IsNotEmpty()
  identifier!: string;

  @IsNotEmpty()
  limitType!: string;
}
