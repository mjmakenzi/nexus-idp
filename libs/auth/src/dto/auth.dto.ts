import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  @IsOptional()
  arcaptcha_token?: string;
}

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @IsString()
  @IsNotEmpty()
  user!: {
    id: string;
    email: string;
    givenName?: string;
    familyName?: string;
    name?: string;
  };
}

export class AppleLoginDto {
  @IsString()
  @IsNotEmpty()
  identityToken!: string;

  @IsString()
  @IsNotEmpty()
  authorizationCode!: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class AppleLogoutDto {
  @IsString()
  @IsNotEmpty()
  apple_access_token!: string;
}

export class LogoutDto {}
