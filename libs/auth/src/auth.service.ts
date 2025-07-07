import { Injectable } from '@nestjs/common';
import { AppleLoginDto, GoogleLoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  async googleLogin(dto: GoogleLoginDto) {
    return {
      status: 'success',
      data: {
        message: 'Google login successful',
      },
    };
  }

  async appleLogin(dto: AppleLoginDto) {
    return {
      status: 'success',
      data: {
        message: 'Apple login successful',
      },
    };
  }
}
