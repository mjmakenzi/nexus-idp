import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RcaptchaGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const archaptcha_by_pass =
      request.headers['arcaptcha'] ===
      this.configService.getOrThrow<string>('arcaptcha.bypassSecret');

    if (!archaptcha_by_pass) {
      const isValid = await this.isValidCaptcha(request.body?.arcaptcha_token);
      if (!isValid) {
        throw new UnauthorizedException('Invalid captcha');
      }
    }
    return true;
  }

  private async isValidCaptcha(token?: string): Promise<boolean> {
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
