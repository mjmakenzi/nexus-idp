import { OtpPurpose } from '@app/db';
import { IsNotEmpty, IsString } from 'class-validator';

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

export class LoginPhoneDto {
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
  arcaptcha_token!: string;
}
