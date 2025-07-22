import {
  OtpDeliveryMethod,
  OtpIdentifier,
  OtpPurpose,
  UserEntity,
} from '@app/db';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsNotEmpty()
  userAgent!: string;

  @IsString()
  @IsNotEmpty()
  ipAddress!: string;

  @IsEnum(OtpDeliveryMethod)
  @IsNotEmpty()
  deliveryMethod!: OtpDeliveryMethod;
}

export class FindOtpDto {
  @IsEnum(OtpIdentifier)
  @IsNotEmpty()
  identifier!: OtpIdentifier;

  @IsEnum(OtpPurpose)
  @IsNotEmpty()
  purpose!: OtpPurpose;
}
