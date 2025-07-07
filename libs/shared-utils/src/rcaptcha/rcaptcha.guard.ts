import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RcaptchaService } from './rcaptcha.service';

@Injectable()
export class RcaptchaGuard implements CanActivate {
  constructor(
    private readonly rcaptchaService: RcaptchaService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const archaptcha_by_pass =
      request.headers['arcaptcha'] ===
      this.configService.getOrThrow<string>('arcaptcha.bypassSecret');

    if (!archaptcha_by_pass) {
      const isValid = await this.rcaptchaService.isValidCaptcha(
        request.body?.arcaptcha_token,
      );
      if (!isValid) {
        throw new UnauthorizedException('Invalid captcha');
      }
    }
    return true;
  }
}
