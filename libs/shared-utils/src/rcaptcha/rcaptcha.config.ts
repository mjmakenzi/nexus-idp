/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IConfiguration } from './rcaptcha.interface';

export function rcaptchaConfig(): IConfiguration {
  return {
    arcaptcha: {
      verifyUrl: process.env.ARCAPTCHA_VERIFY_URL!,
      secretKey: process.env.ARCAPTCHA_SECRET_KEY!,
      siteKey: process.env.ARCAPTCHA_SITE_KEY!,
      bypassSecret: process.env.ARCAPTCHA_BYPASS_SECRET!,
    },
  };
}
