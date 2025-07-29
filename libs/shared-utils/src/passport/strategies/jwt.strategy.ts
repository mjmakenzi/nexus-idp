import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { SessionRepository } from '@app/db';
import { IAccessPayload } from '@app/shared-utils';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly sessionRepo: SessionRepository,
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

    const session = await this.sessionRepo.findSessionWithUser(
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
