import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { SessionEntity, UserEntity } from '@app/db';
import { IAccessPayload, IRefreshPayload } from './jwt.interface';

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly config: ConfigService,
  ) {}

  async issueAccessToken(
    user: UserEntity,
    session: SessionEntity,
  ): Promise<string> {
    console.log(session);

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.getOrThrow<string>('jwt.expiresIn');

    const payload: IAccessPayload = {
      iss: this.config.getOrThrow<string>('jwt.iss'),
      iat: now,
      type: 'access',
      sub: user.id.toString(),
      sessionId: session.sessionId,
      data: {
        user: {
          id: user.id.toString(), // Convert BigInt to string for JSON serialization
          username: user.username,
          display_name: user.profile?.displayname ?? '',
          email: user.email,
          emailVerifiedAt: user.emailVerifiedAt,
          phoneVerifiedAt: user.phoneVerifiedAt,
          createdAt: user.createdAt,
        },
      },
    };

    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('jwt.secret'),
      expiresIn,
    });
  }

  async issueRefreshToken(
    user: UserEntity,
    session: SessionEntity,
  ): Promise<{ refreshToken: string; expiresIn: number }> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.getOrThrow<string>('jwt.refreshExpiresIn');

    const payload: IRefreshPayload = {
      iss: this.config.getOrThrow<string>('jwt.iss'),
      iat: now,
      type: 'refresh',
      sub: user.id.toString(),
      sessionId: session.sessionId,
      data: {
        user: {
          id: user.id.toString(), // Convert BigInt to string for JSON serialization
        },
      },
    };

    return {
      refreshToken: this.jwtService.sign(payload, {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn,
      }),
      expiresIn: this.parseExpirationTime(expiresIn),
    };
  }

  /**
   * Parse expiration time string to seconds
   * Supports formats like: '15m', '1h', '7d', '30s'
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiration time format: ${expiresIn}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }
  }
}
