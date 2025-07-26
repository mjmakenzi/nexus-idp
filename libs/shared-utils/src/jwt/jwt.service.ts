import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { UserEntity } from '@app/db';
import { JwtPayload, JwtRefreshPayload } from './jwt.interface';

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly config: ConfigService,
  ) {}

  async issueAccessToken(user: UserEntity, sessionId: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.getOrThrow<string>('jwt.expiresIn');

    const payload: JwtPayload = {
      iat: now,
      type: 'access',
      sub: user.id.toString(),
      sessionId,
      data: {
        user: {
          id: user.id,
          username: user.username,
          display_name: user.profile?.displayname ?? '',
          email: user.email,
          emailVerifiedAt: user.emailVerifiedAt,
          phoneVerifiedAt: user.phoneVerifiedAt,
          status: user.status,
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
    sessionId: string,
  ): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.config.getOrThrow<string>('jwt.refreshExpiresIn');

    const payload: JwtRefreshPayload = {
      iat: now,
      type: 'refresh',
      sub: user.id.toString(),
      sessionId,
      data: {
        user: {
          id: user.id,
        },
      },
    };

    return this.jwtService.sign(payload, { expiresIn });
  }

  // async verifyToken(refreshToken: string) {
  //   return await this.jwtService.verify(refreshToken, {
  //     secret: this.config.getOrThrow<string>('jwt.secret'),
  //   });
  // }

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
