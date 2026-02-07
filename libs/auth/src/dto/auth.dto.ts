import {
  OtpDeliveryMethod,
  OtpIdentifier,
  OtpPurpose,
  UserEntity,
} from '@app/db';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  IsValidCountryCode,
  IsValidEmail,
  IsValidIpAddress,
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

export class SendOtpEmailDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

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

export class LoginEmailDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsValidOtpCode()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  otp!: string;

  @IsString()
  @IsNotEmpty({ message: 'Captcha token is required' })
  arcaptcha_token!: string;
}

export class CreateOtpDto {
  @IsOptional()
  user?: UserEntity | null;

  @IsEnum(OtpPurpose)
  @IsOptional()
  purpose!: OtpPurpose;

  @IsEnum(OtpIdentifier)
  @IsOptional()
  identifier!: OtpIdentifier;

  @IsString()
  @IsNotEmpty({ message: 'User agent is required' })
  userAgent!: string;

  @IsString()
  @IsNotEmpty({ message: 'IP address is required' })
  @IsValidIpAddress()
  ipAddress!: string;

  @IsEnum(OtpDeliveryMethod)
  @IsNotEmpty({ message: 'Delivery method is required' })
  deliveryMethod!: OtpDeliveryMethod;

  @IsString()
  @IsOptional()
  @IsValidCountryCode()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  countryCode?: string;

  @IsString()
  @IsOptional()
  @IsValidPhoneNumber()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phoneNumber?: string;
}

export class FindOtpDto {
  @IsEnum(OtpIdentifier)
  @IsNotEmpty({ message: 'OTP identifier is required' })
  identifier!: OtpIdentifier;

  @IsEnum(OtpPurpose)
  @IsNotEmpty({ message: 'OTP purpose is required' })
  purpose!: OtpPurpose;

  @IsString()
  @IsOptional()
  @IsValidCountryCode()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  countryCode?: string;

  @IsString()
  @IsOptional()
  @IsValidPhoneNumber()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phoneNumber?: string;
}
