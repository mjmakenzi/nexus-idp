import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { RcaptchaGuard } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

// import {
//   OneClickEmailDto,
//   OneClickPhoneDto,
//   SendOptEmailDto,
//   SendOtpPhoneDto,
// } from '../../../../otp/src/dto/otp.dtp';
// import { OtpService } from '../services/otp.service';

const PATH = 'account';

@Controller({ path: PATH })
export class OtpController {
  constructor() {}

  // // @UseGuards(RcaptchaGuard)
  // @Post('v1/send-otp-phone')
  // sendOtpPhone(@Req() req: FastifyRequest, @Body() body: SendOtpPhoneDto) {
  //   return this.otpService.sendOtpPhone(req, body);
  // }

  // // @UseGuards(RcaptchaGuard)
  // @Post('v1/one-click-phone')
  // oneClickPhone(@Body() body: OneClickPhoneDto) {
  //   return this.otpService.oneClickPhone(body);
  // }

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
