import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { SessionRepository, UserRepository } from '@app/db';
import { JwtRefreshPayload } from '@app/shared-utils';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly sessionRepo: SessionRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtRefreshPayload) {
    console.log('payload', payload);
    // Validate that sessionId exists and is a valid number
    if (!payload.sessionId || isNaN(Number(payload.sessionId))) {
      throw new UnauthorizedException('Invalid session ID in refresh token');
    }

    const sessionId = Number(payload.sessionId);
    const userId = Number(payload.sub);

    // Validate that user ID is also valid
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid user ID in refresh token');
    }

    const session = await this.sessionRepo.findOne({
      id: sessionId,
      user: userId,
      terminatedAt: null,
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    return session;
  }
}
