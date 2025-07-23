import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { LoginPhoneDto, SendOtpPhoneDto } from '@app/auth';
import { JwtRefreshAuthGuard, RcaptchaGuard } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';

const PATH = 'account';

@Controller({ path: PATH })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @UseGuards(RcaptchaGuard)
  @Post('v1/send-otp-phone')
  sendOtpPhone(@Req() req: FastifyRequest, @Body() body: SendOtpPhoneDto) {
    return this.authService.sendOtpPhone(req, body);
  }

  // @UseGuards(RcaptchaGuard)
  @Post('v1/one-click-phone')
  oneClickPhone(@Req() req: FastifyRequest, @Body() body: LoginPhoneDto) {
    return this.authService.loginPhone(req, body);
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Post('v1/refresh-token')
  refreshToken(@Req() req: FastifyRequest) {
    return this.authService.refreshToken(req);
  }

  // @UseGuards(RcaptchaGuard)
  // @Post('v1/send-otp-email')
  // sendOtpEmail(@Req() req: FastifyRequest, @Body() body: SendOptEmailDto) {
  //   return this.otpService.sendOptEmail(req, body);
  // }

  // @UseGuards(RcaptchaGuard)
  // @Post('v1/one-click-email')
  // oneClickEmail(@Body() body: OneClickEmailDto) {
  //   return this.otpService.oneClickEmail(body);
  // }
}
