import {
  OtpDeliveryMethod,
  OtpIdentifier,
  OtpPurpose,
  UserEntity,
} from '@app/db';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  IsValidCountryCode,
  IsValidEmail,
  IsValidIpAddress,
  IsValidOtpCode,
  IsValidPhoneNumber,
} from './validators';

export class SendOptEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsValidEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP type is required' })
  type!: string;

  @IsString()
  @IsOptional()
  arcaptcha_token?: string;
}

export class OneClickEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  @IsValidEmail()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP code is required' })
  @IsValidOtpCode()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  otp!: string;
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
