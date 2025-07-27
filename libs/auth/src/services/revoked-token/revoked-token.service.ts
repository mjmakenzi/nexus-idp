import { Injectable } from '@nestjs/common';
import {
  RevokedTokenEntity,
  RevokedTokenRepository,
  SessionEntity,
  UserEntity,
} from '@app/db';

@Injectable()
export class RevokedTokenService {
  constructor(private readonly revokedTokenRepo: RevokedTokenRepository) {}

  async createRevokedToken(
    session: SessionEntity,
  ): Promise<RevokedTokenEntity> {
    const createRevokedTokenDto: Partial<RevokedTokenEntity> = {
      user: session.user,
      tokenHash: session.refreshTokenHash,
      tokenType: 'refresh',
      expiresAt: session.expiresAt,
      revokedAt: new Date(),
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    };

    return this.revokedTokenRepo.createRevokedToken(createRevokedTokenDto);
  }

  async findRevokedToken(
    tokenHash: string,
  ): Promise<RevokedTokenEntity | null> {
    return this.revokedTokenRepo.findByTokenHash(tokenHash);
  }
}
