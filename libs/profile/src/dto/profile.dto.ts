import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @IsNotEmpty()
  username!: string;
}

export class GetUserProfileDto {
  @IsString()
  @IsNotEmpty()
  user_id!: string;
}
