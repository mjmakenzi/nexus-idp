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
  @IsNotEmpty()
  countryCode!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

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
