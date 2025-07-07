/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './nodemailer.interface';

export function nodemailerConfig(): IConfiguration {
  return {
    email: {
      bodySocial: process.env.EMAIL_BODY_SOCIAL!,
      bodyLogo: process.env.EMAIL_BODY_LOGO!,
      bodyBoxOtp: process.env.EMAIL_BODY_BOX_OTP!,
      base: process.env.EMAIL_BASE!,
      body: process.env.EMAIL_BODY!,
      subject: process.env.EMAIL_SUBJECT!,
    },
  };
}
