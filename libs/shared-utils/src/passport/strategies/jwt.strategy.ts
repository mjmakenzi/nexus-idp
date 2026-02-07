import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@app/db';
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

    // Validate user status
    const user = session.user;
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check user status
    switch (user.status) {
      case UserStatus.ACTIVE:
        // User can access protected routes
        break;
      case UserStatus.PENDING:
        throw new UnauthorizedException(
          'Account is pending activation. Please contact support.',
        );
      case UserStatus.SUSPENDED:
        throw new UnauthorizedException(
          'Account is suspended. Please contact support.',
        );
      case UserStatus.DELETED:
        throw new UnauthorizedException('Account has been deleted.');
      default:
        throw new UnauthorizedException('Invalid account status.');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        'Account is temporarily locked. Please try again later.',
      );
    }

    // TODO: Optionally update lastActivityAt or cache in memory
    return session;
  }
}
