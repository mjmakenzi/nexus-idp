import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { SessionRepository } from '@app/db';
import { CommonService, IRefreshPayload } from '@app/shared-utils';
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
    private readonly commonService: CommonService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('jwt.refreshSecret'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: IRefreshPayload) {
    const now = new Date();
    // Validate that sessionId exists and is a valid number
    if (!payload.sessionId || typeof payload.sessionId !== 'string') {
      throw new UnauthorizedException('Invalid session ID in refresh token');
    }

    const sessionId = payload.sessionId;
    const userId = Number(payload.sub);

    // Validate that user ID is also valid
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid user ID in refresh token');
    }

    const session = await this.sessionRepo.findSessionWithUser(
      sessionId,
      userId,
    );

    if (!session) {
      throw new UnauthorizedException('Session Terminated. Please re-login.');
    }

    // Check if session is expired (more than 15 days or 90 days)
    if (now > session.expiresAt || now > session.maxExpiresAt) {
      session.terminatedAt = now;
      session.terminationReason = 'session_expired';
      await this.sessionRepo.updateSession(session.id, session);
      throw new UnauthorizedException('Session expired. Please re-login.');
    }

    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    const isValid = await this.commonService.compare(
      refreshToken ?? '',
      session.refreshTokenHash ?? '',
    );

    if (!isValid) {
      session.terminatedAt = new Date();
      session.terminationReason = 'token_reuse_detected';
      await this.sessionRepo.updateSession(session.id, session);
      // TODO: Log security event
      // TODO: Store in token_blacklist (optional but recommended)
      throw new UnauthorizedException('Invalid refresh token');
    }

    return session;

    // TODO: Return a DTO with only the selected fields
    // return {
    //   id: session.id,
    //   accessTokenHash: session.accessTokenHash,
    //   refreshTokenHash: session.refreshTokenHash,
    //   expiresAt: session.expiresAt,
    //   lastActivityAt: session.lastActivityAt,
    //   user: {
    //     id: session.user.id,
    //     username: session.user.username,
    //     email: session.user.email,
    //     emailVerifiedAt: session.user.emailVerifiedAt,
    //     phoneVerifiedAt: session.user.phoneVerifiedAt,
    //     createdAt: session.user.createdAt,
    //     profile: {
    //       displayname: session.user.profile?.displayname,
    //     },
    //   },
    // };
  }
}
