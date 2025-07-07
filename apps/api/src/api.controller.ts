import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import {
  OneClickEmailDto,
  OneClickPhoneDto,
  OtpService,
  SendOptEmailDto,
  SendOtpPhoneDto,
} from '@app/otp';
import { RcaptchaGuard } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

const PATH = 'account';

@Controller({ path: PATH })
export class ApiController {
  constructor(private readonly otpService: OtpService) {}

  @UseGuards(RcaptchaGuard)
  @Post('v1/send-otp-phone')
  sendOtpPhone(@Req() req: FastifyRequest, @Body() body: SendOtpPhoneDto) {
    return this.otpService.sendOtpPhone(req, body);
  }

  @UseGuards(RcaptchaGuard)
  @Post('v1/one-click-phone')
  oneClickPhone(@Body() body: OneClickPhoneDto) {
    return this.otpService.oneClickPhone(body);
  }

  @UseGuards(RcaptchaGuard)
  @Post('v1/send-otp-email')
  sendOtpEmail(@Req() req: FastifyRequest, @Body() body: SendOptEmailDto) {
    return this.otpService.sendOptEmail(req, body);
  }

  @UseGuards(RcaptchaGuard)
  @Post('v1/one-click-email')
  oneClickEmail(@Body() body: OneClickEmailDto) {
    return this.otpService.oneClickEmail(body);
  }
}
