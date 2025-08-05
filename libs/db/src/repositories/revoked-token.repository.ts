import { EntityRepository } from '@mikro-orm/postgresql';
import {
  RevokedTokenEntity,
  TokenType,
} from '../entities/revoked-token.entity';
import { UserEntity } from '../entities/user.entity';

export class RevokedTokenRepository extends EntityRepository<RevokedTokenEntity> {
  /**
   * Find revoked token by ID
   */
  async findById(id: number): Promise<RevokedTokenEntity | null> {
    return this.findOne({ id });
  }

  /**
   * Find revoked token by token hash
   */
  async findByTokenHash(tokenHash: string): Promise<RevokedTokenEntity | null> {
    return this.findOne({ tokenHash });
  }

  /**
   * Find revoked tokens by user ID
   */
  async findByUser(userId: number): Promise<RevokedTokenEntity[]> {
    return this.find({ user: userId });
  }

  /**
   * Find revoked tokens by token type
   */
  async findByTokenType(tokenType: TokenType): Promise<RevokedTokenEntity[]> {
    return this.find({ tokenType });
  }

  /**
   * Find revoked tokens by IP address
   */
  async findByIpAddress(ipAddress: string): Promise<RevokedTokenEntity[]> {
    return this.find({ ipAddress });
  }

  /**
   * Find revoked tokens by user agent
   */
  async findByUserAgent(userAgent: string): Promise<RevokedTokenEntity[]> {
    return this.find({ userAgent });
  }

  /**
   * Find revoked tokens that expired before a specific date
   */
  async findExpiredBefore(date: Date): Promise<RevokedTokenEntity[]> {
    return this.find({ expiresAt: { $lt: date } });
  }

  /**
   * Find revoked tokens that were revoked after a specific date
   */
  async findRevokedAfter(date: Date): Promise<RevokedTokenEntity[]> {
    return this.find({ revokedAt: { $gte: date } });
  }

  /**
   * Find revoked tokens that were revoked before a specific date
   */
  async findRevokedBefore(date: Date): Promise<RevokedTokenEntity[]> {
    return this.find({ revokedAt: { $lt: date } });
  }

  /**
   * Find revoked tokens within a revocation date range
   */
  async findRevokedInRange(
    startDate: Date,
    endDate: Date,
  ): Promise<RevokedTokenEntity[]> {
    return this.find({
      revokedAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });
  }

  /**
   * Find recently revoked tokens (last N hours)
   */
  async findRecentlyRevoked(hours: number = 24): Promise<RevokedTokenEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.find({
      revokedAt: { $gte: cutoffDate },
    });
  }

  /**
   * Find revoked tokens by user and token type
   */
  async findByUserAndType(
    userId: number,
    tokenType: TokenType,
  ): Promise<RevokedTokenEntity[]> {
    return this.find({ user: userId, tokenType });
  }

  /**
   * Find revoked tokens by user and IP address
   */
  async findByUserAndIp(
    userId: number,
    ipAddress: string,
  ): Promise<RevokedTokenEntity[]> {
    return this.find({ user: userId, ipAddress });
  }

  /**
   * Create a new revoked token record
   */
  async createRevokedToken(
    dto: Partial<RevokedTokenEntity>,
  ): Promise<RevokedTokenEntity> {
    const revokedToken = this.create(dto as RevokedTokenEntity);

    await this.em.persistAndFlush(revokedToken);
    return revokedToken;
  }

  /**
   * Update revoked token information
   */
  async updateRevokedToken(
    id: number,
    revokedTokenData: Partial<RevokedTokenEntity>,
  ): Promise<RevokedTokenEntity | null> {
    const revokedToken = await this.findOne({ id });
    if (!revokedToken) return null;

    this.assign(revokedToken, revokedTokenData);
    await this.em.flush();
    return revokedToken;
  }

  /**
   * Update IP address for a revoked token
   */
  async updateIpAddress(id: number, ipAddress: string): Promise<void> {
    await this.nativeUpdate({ id }, { ipAddress: ipAddress });
  }

  /**
   * Update user agent for a revoked token
   */
  async updateUserAgent(id: number, userAgent: string): Promise<void> {
    await this.nativeUpdate({ id }, { userAgent: userAgent });
  }

  /**
   * Check if a token hash is revoked
   */
  async isTokenRevoked(tokenHash: string): Promise<boolean> {
    const revokedToken = await this.findOne({ tokenHash });
    return !!revokedToken;
  }

  /**
   * Check if a token hash is revoked and not expired
   */
  async isTokenRevokedAndValid(tokenHash: string): Promise<boolean> {
    const revokedToken = await this.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });
    return !!revokedToken;
  }

  /**
   * Get revocation count for a user
   */
  async getRevocationCountForUser(userId: number): Promise<number> {
    return this.count({ user: userId });
  }

  /**
   * Get revocation count for a user by token type
   */
  async getRevocationCountForUserByType(
    userId: number,
    tokenType: TokenType,
  ): Promise<number> {
    return this.count({ user: userId, tokenType });
  }

  /**
   * Delete revoked token by ID
   */
  async deleteRevokedToken(id: number): Promise<boolean> {
    const revokedToken = await this.findOne({ id });
    if (!revokedToken) return false;

    await this.em.removeAndFlush(revokedToken);
    return true;
  }

  /**
   * Delete revoked token by token hash
   */
  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    const revokedToken = await this.findOne({ tokenHash });
    if (!revokedToken) return false;

    await this.em.removeAndFlush(revokedToken);
    return true;
  }

  /**
   * Delete all revoked tokens for a specific user
   */
  async deleteByUser(userId: number): Promise<number> {
    const result = await this.nativeDelete({ user: userId });
    return result;
  }

  /**
   * Delete all revoked tokens for a specific token type
   */
  async deleteByTokenType(tokenType: TokenType): Promise<number> {
    const result = await this.nativeDelete({ tokenType });
    return result;
  }

  /**
   * Delete expired revoked tokens
   */
  async deleteExpired(): Promise<number> {
    const result = await this.nativeDelete({
      expiresAt: { $lt: new Date() },
    });
    return result;
  }

  /**
   * Delete old revoked tokens (older than specified days)
   */
  async deleteOldTokens(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.nativeDelete({
      revokedAt: { $lt: cutoffDate },
    });
    return result;
  }

  /**
   * Count all revoked tokens
   */
  async countRevokedTokens(): Promise<number> {
    return this.count({});
  }

  /**
   * Count revoked tokens for a specific user
   */
  async countByUser(userId: number): Promise<number> {
    return this.count({ user: userId });
  }

  /**
   * Count revoked tokens by token type
   */
  async countByTokenType(tokenType: TokenType): Promise<number> {
    return this.count({ tokenType });
  }

  /**
   * Count revoked tokens by IP address
   */
  async countByIpAddress(ipAddress: string): Promise<number> {
    return this.count({ ipAddress });
  }

  /**
   * Count expired revoked tokens
   */
  async countExpired(): Promise<number> {
    return this.count({ expiresAt: { $lt: new Date() } });
  }

  /**
   * Count recently revoked tokens
   */
  async countRecentlyRevoked(hours: number = 24): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.count({ revokedAt: { $gte: cutoffDate } });
  }

  /**
   * Get revoked token statistics
   */
  async getRevokedTokenStats(): Promise<{
    total: number;
    expired: number;
    recentlyRevoked: number;
    byType: Record<string, number>;
    byUser: Record<string, number>;
  }> {
    const [total, expired, recentlyRevoked] = await Promise.all([
      this.countRevokedTokens(),
      this.countExpired(),
      this.countRecentlyRevoked(),
    ]);

    // Get counts by token type
    const typeStats = await this.em.execute(`
      SELECT token_type, COUNT(*) as count
      FROM revoked_tokens
      GROUP BY token_type
    `);

    // Get counts by user (top 10 users with most revocations)
    const userStats = await this.em.execute(`
      SELECT user_id, COUNT(*) as count
      FROM revoked_tokens
      GROUP BY user_id
      ORDER BY count DESC
      LIMIT 10
    `);

    const byType: Record<string, number> = {};
    const byUser: Record<string, number> = {};

    typeStats.forEach((stat: any) => {
      byType[stat.token_type] = parseInt(stat.count);
    });

    userStats.forEach((stat: any) => {
      byUser[stat.user_id] = parseInt(stat.count);
    });

    return {
      total,
      expired,
      recentlyRevoked,
      byType,
      byUser,
    };
  }

  /**
   * Find revoked tokens by multiple criteria
   */
  async findByCriteria(criteria: {
    userId?: number;
    tokenType?: TokenType;
    ipAddress?: string;
    userAgent?: string;
    expiresAfter?: Date;
    expiresBefore?: Date;
    revokedAfter?: Date;
    revokedBefore?: Date;
  }): Promise<RevokedTokenEntity[]> {
    const where: any = {};

    if (criteria.userId) where.user = criteria.userId;
    if (criteria.tokenType) where.tokenType = criteria.tokenType;
    if (criteria.ipAddress) where.ipAddress = criteria.ipAddress;
    if (criteria.userAgent) where.userAgent = criteria.userAgent;

    if (criteria.expiresAfter || criteria.expiresBefore) {
      where.expiresAt = {};
      if (criteria.expiresAfter) where.expiresAt.$gte = criteria.expiresAfter;
      if (criteria.expiresBefore) where.expiresAt.$lt = criteria.expiresBefore;
    }

    if (criteria.revokedAfter || criteria.revokedBefore) {
      where.revokedAt = {};
      if (criteria.revokedAfter) where.revokedAt.$gte = criteria.revokedAfter;
      if (criteria.revokedBefore) where.revokedAt.$lt = criteria.revokedBefore;
    }

    return this.find(where);
  }

  /**
   * Bulk update revoked tokens
   */
  async bulkUpdate(
    criteria: any,
    updates: Partial<RevokedTokenEntity>,
  ): Promise<number> {
    const result = await this.nativeUpdate(criteria, updates);
    return result;
  }

  /**
   * Get revoked tokens with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: {
      userId?: number;
      tokenType?: TokenType;
      ipAddress?: string;
    },
  ): Promise<{
    revokedTokens: RevokedTokenEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.userId) where.user = filters.userId;
    if (filters?.tokenType) where.tokenType = filters.tokenType;
    if (filters?.ipAddress) where.ipAddress = filters.ipAddress;

    const [revokedTokens, total] = await Promise.all([
      this.find(where, { limit, offset, orderBy: { revokedAt: 'DESC' } }),
      this.count(where),
    ]);

    return {
      revokedTokens,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get revoked tokens for a user with pagination
   */
  async findUserRevokedTokensWithPagination(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    revokedTokens: RevokedTokenEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const [revokedTokens, total] = await Promise.all([
      this.find(
        { user: userId },
        { limit, offset, orderBy: { revokedAt: 'DESC' } },
      ),
      this.countByUser(userId),
    ]);

    return {
      revokedTokens,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get revoked tokens by IP address with pagination
   */
  async findByIpAddressWithPagination(
    ipAddress: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    revokedTokens: RevokedTokenEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const [revokedTokens, total] = await Promise.all([
      this.find(
        { ipAddress },
        { limit, offset, orderBy: { revokedAt: 'DESC' } },
      ),
      this.countByIpAddress(ipAddress),
    ]);

    return {
      revokedTokens,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get revoked tokens by token type with pagination
   */
  async findByTokenTypeWithPagination(
    tokenType: TokenType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    revokedTokens: RevokedTokenEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const [revokedTokens, total] = await Promise.all([
      this.find(
        { tokenType },
        { limit, offset, orderBy: { revokedAt: 'DESC' } },
      ),
      this.countByTokenType(tokenType),
    ]);

    return {
      revokedTokens,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Clean up old revoked tokens (automated maintenance)
   */
  async cleanupOldTokens(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.nativeDelete({
      revokedAt: { $lt: cutoffDate },
    });
    return result;
  }

  /**
   * Get revocation timeline for a user
   */
  async getUserRevocationTimeline(
    userId: number,
    days: number = 30,
  ): Promise<RevokedTokenEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.find(
      { user: userId, revokedAt: { $gte: cutoffDate } },
      { orderBy: { revokedAt: 'DESC' } },
    );
  }

  /**
   * Get revocation timeline by IP address
   */
  async getIpRevocationTimeline(
    ipAddress: string,
    days: number = 30,
  ): Promise<RevokedTokenEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.find(
      { ipAddress, revokedAt: { $gte: cutoffDate } },
      { orderBy: { revokedAt: 'DESC' } },
    );
  }

  /**
   * Get unique IP addresses that have had tokens revoked
   */
  async getUniqueRevokedIps(): Promise<string[]> {
    const result = await this.em.execute(`
      SELECT DISTINCT ip_address
      FROM revoked_tokens
      WHERE ip_address IS NOT NULL
      ORDER BY ip_address
    `);
    return result.map((row: any) => row.ip_address);
  }

  /**
   * Get unique user agents that have had tokens revoked
   */
  async getUniqueRevokedUserAgents(): Promise<string[]> {
    const result = await this.em.execute(`
      SELECT DISTINCT user_agent
      FROM revoked_tokens
      WHERE user_agent IS NOT NULL
      ORDER BY user_agent
    `);
    return result.map((row: any) => row.user_agent);
  }
}
