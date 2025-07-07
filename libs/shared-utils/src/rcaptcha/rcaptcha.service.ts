import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RcaptchaService {
  constructor(private readonly configService: ConfigService) {}
  async isValidCaptcha(token?: string): Promise<boolean> {
    if (!token) return false;
    try {
      const response = await fetch(
        this.configService.getOrThrow<string>('arcaptcha.verifyUrl'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            secret_key: this.configService.getOrThrow<string>(
              'arcaptcha.secretKey',
            ),
            challenge_id: token,
            site_key:
              this.configService.getOrThrow<string>('arcaptcha.siteKey'),
          }),
        },
      );
      const data = await response.json();
      if (typeof data.success !== 'undefined') {
        return !!data.success;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
}
