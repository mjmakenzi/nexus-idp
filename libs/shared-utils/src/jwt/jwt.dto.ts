import { IsDate, IsNumber, IsObject, IsString } from 'class-validator';

export class AccessPayloadDto {
  @IsNumber()
  id!: number;

  @IsString()
  accessTokenHash!: string;

  @IsString()
  refreshTokenHash!: string;

  @IsDate()
  expiresAt!: Date;

  @IsDate()
  lastActivityAt!: Date;

  @IsObject()
  user!: {
    id: number;
    username: string;
    email: string;
    emailVerifiedAt: Date;
    phoneVerifiedAt: Date;
    createdAt: Date;
    profile: {
      displayname: string;
    };
  };
}
