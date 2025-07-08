import { IsNotEmpty, IsString } from 'class-validator';

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

export class AppleLoginDto {}
