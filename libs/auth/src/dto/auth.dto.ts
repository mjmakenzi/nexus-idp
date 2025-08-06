import { OtpPurpose } from '@app/db';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import {
  IsValidCountryCode,
  IsValidOtpCode,
  IsValidPhoneNumber,
} from './validators';

export class SendOtpPhoneDto {
  @IsNotEmpty({ message: 'Country code is required' })
  @IsValidCountryCode()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country_code!: string;

  @IsNotEmpty({ message: 'Phone number is required' })
  @IsValidPhoneNumber()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone_no!: string;

  @IsEnum(OtpPurpose, {
    message:
      'Invalid OTP purpose. Must be one of: login, register, reset, verify, mfa, change_email, change_phone',
  })
  @IsNotEmpty({ message: 'OTP type is required' })
  type!: OtpPurpose;

  @IsString()
  @IsNotEmpty({ message: 'Captcha token is required' })
  arcaptcha_token!: string;
}

export class LoginPhoneDto {
  @IsString()
  @IsNotEmpty({ message: 'Country code is required' })
  @IsValidCountryCode()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  country_code!: string;

  @IsString()
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsValidPhoneNumber()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone_no!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsValidOtpCode()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  otp!: string;

  @IsString()
  @IsNotEmpty({ message: 'Captcha token is required' })
  arcaptcha_token!: string;
}
