import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  AppleLoginDto,
  AppleLogoutDto,
  AuthService,
  GoogleLoginDto,
  LogoutDto,
} from '@app/auth';
// import {
//   OneClickEmailDto,
//   OneClickPhoneDto,
//   OtpService,
//   SendOptEmailDto,
//   SendOtpPhoneDto,
// } from '@app/otp';
import { JwtAuthGuard, RcaptchaGuard } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

const PATH = 'account';

@Controller({ path: PATH })
export class ApiController {
  constructor(
    // private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  // @Post('v1/google-login')
  // googleLogin(@Body() body: GoogleLoginDto) {
  //   return this.authService.googleLogin(body);
  // }

  // @Post('v1/apple-login')
  // appleLogin(@Body() body: AppleLoginDto) {
  //   return this.authService.appleLogin(body);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post('v1/apple-logout')
  // appleLogout(@Body() body: AppleLogoutDto) {
  //   return this.authService.appleLogout(body);
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post('v1/logout')
  // logout(@Body() body: LogoutDto, @Req() req: FastifyRequest) {
  //   return this.authService.logout(body, req);
  // }
}
