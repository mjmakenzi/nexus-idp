import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { IAccessPayload } from '@app/shared-utils';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SessionService } from '../../session/session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  async validate(payload: IAccessPayload) {
    const userId = Number(payload.sub);
    const sessionId = payload.sessionId;

    if (isNaN(userId) || !sessionId) {
      throw new BadRequestException('Invalid token payload');
    }

    const session = await this.sessionService.findSessionWithUser(
      sessionId,
      userId,
    );

    if (!session) {
      throw new UnauthorizedException('Session Terminated. Please re-login.');
    }

    // TODO: Optionally update lastActivityAt or cache in memory
    return session.user;
  }
}
