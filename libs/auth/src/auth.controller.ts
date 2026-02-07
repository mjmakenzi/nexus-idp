import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  LoginEmailDto,
  LoginPhoneDto,
  SendOtpEmailDto,
  SendOtpPhoneDto,
} from '@app/auth';
import { JwtRefreshAuthGuard } from '@app/shared-utils';
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

  @UseGuards(JwtRefreshAuthGuard)
  @Post('v1/logout')
  logout(@Req() req: FastifyRequest) {
    return this.authService.logout(req);
  }

  // @UseGuards(RcaptchaGuard)
  @Post('v1/send-otp-email')
  sendOtpEmail(@Req() req: FastifyRequest, @Body() body: SendOtpEmailDto) {
    return this.authService.sendOtpEmail(req, body);
  }

  // @UseGuards(RcaptchaGuard)
  @Post('v1/one-click-email')
  oneClickEmail(@Req() req: FastifyRequest, @Body() body: LoginEmailDto) {
    return this.authService.loginEmail(req, body);
  }
}
