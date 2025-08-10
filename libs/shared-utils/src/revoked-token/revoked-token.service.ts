import { Injectable } from '@nestjs/common';
import {
  RevocationReason,
  RevokedTokenEntity,
  RevokedTokenRepository,
  SessionEntity,
  TokenType,
} from '@app/db';

@Injectable()
export class RevokedTokenService {
  constructor(private readonly revokedTokenRepo: RevokedTokenRepository) {}

  async createRevokedToken(
    session: SessionEntity,
    reason: RevocationReason,
  ): Promise<RevokedTokenEntity> {
    const createRevokedTokenDto: Partial<RevokedTokenEntity> = {
      user: session.user,
      tokenHash: session.refreshTokenHash,
      tokenType: TokenType.REFRESH,
      expiresAt: session.expiresAt,
      revokedAt: new Date(),
      revocationReason: reason,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      issuedAt: session.createdAt,
    };

    return this.revokedTokenRepo.createRevokedToken(createRevokedTokenDto);
  }

  async findRevokedToken(
    tokenHash: string,
  ): Promise<RevokedTokenEntity | null> {
    return this.revokedTokenRepo.findByTokenHash(tokenHash);
  }
}
