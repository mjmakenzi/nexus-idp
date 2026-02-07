import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  passwordHash?: string;

  @IsString()
  @IsOptional()
  passwordSalt?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @IsDate()
  @IsOptional()
  phoneVerifiedAt?: Date;
}

export class findUserByPhoneDto {
  @IsString()
  @IsNotEmpty()
  countryCode!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;
}

export class findUserByEmailDto {
  @IsString()
  @IsNotEmpty()
  email!: string;
}
