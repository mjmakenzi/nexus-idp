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
    const sessionId = Number(payload.sessionId);

    if (isNaN(userId) || isNaN(sessionId)) {
      throw new BadRequestException('Invalid token payload');
    }

    const session = await this.sessionRepo.findSessionAndUser(
      sessionId,
      userId,
    );

    if (!session) {
      throw new UnauthorizedException('Session is invalid');
    }

    // TODO: Optionally update lastActivityAt or cache in memory
    return session.user;
  }
}
