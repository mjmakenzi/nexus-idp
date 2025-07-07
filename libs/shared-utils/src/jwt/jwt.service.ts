import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { UserEntity } from '@app/db';

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly config: ConfigService,
  ) {}

  issueAccessToken(user: UserEntity) {
    const payload = {
      iss: this.config.getOrThrow('jwt.iss'),
      sub: user.id,
      type: 'access',
      data: { user: this.buildUserPayload(user, 'access') },
    };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('jwt.secret'),
      expiresIn: this.config.getOrThrow('jwt.expiresIn'),
    });
  }

  issueRefreshToken(user: UserEntity) {
    const payload = {
      iss: this.config.getOrThrow('jwt.iss'),
      sub: user.id,
      type: 'refresh',
      data: { user: this.buildUserPayload(user, 'refresh') },
    };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow('jwt.secret'),
      expiresIn: this.config.getOrThrow('jwt.refreshExpiresIn'),
    });
  }

  verifyToken(token: string, type?: string): any | null {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.config.getOrThrow('jwt.secret'),
      });
      if (type && payload.type !== type) return null;
      if (payload.exp * 1000 < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }

  getUserIdFromToken(token: string, type?: string): number | null {
    const payload = this.verifyToken(token, type);
    return payload?.data?.user?.id ?? null;
  }

  private buildUserPayload(user: UserEntity, type: 'access' | 'refresh') {
    if (type === 'refresh') {
      return { id: user.id };
    }
    // Add more fields as needed for access tokens
    return {
      id: user.id,
      username: user.username,
      //   display_name: user.displayName,
      email: user.email,
      phone: user.phoneNo,
      email_verified: user.emailVerified,
      phone_verified: user.phoneVerified,
      identity_verified: user.identityVerified,
      // ...add avatar, plan, etc.
    };
  }
}
