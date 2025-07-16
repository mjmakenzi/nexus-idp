import { OtpPurpose } from '@app/auth';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendOtpPhoneDto {
  @IsString()
  @IsNotEmpty()
  country_code!: string;

  @IsString()
  @IsNotEmpty()
  phone_no!: string;

  @IsString()
  @IsNotEmpty()
  type!: OtpPurpose;

  @IsString()
  @IsNotEmpty()
  arcaptcha_token!: string;
}

export class OneClickPhoneDto {
  @IsString()
  @IsNotEmpty()
  country_code!: string;

  @IsString()
  @IsNotEmpty()
  phone_no!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  arcaptcha_token?: string;
}

export class SendOptEmailDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  arcaptcha_token?: string;
}

export class OneClickEmailDto {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  otp!: string;
}
