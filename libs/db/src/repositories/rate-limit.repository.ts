import { EntityRepository } from '@mikro-orm/postgresql';
import { RateLimitEntity } from '../entities/rate-limit.entity';

export class RateLimitRepository extends EntityRepository<RateLimitEntity> {
  /**
   * Find rate limit by ID
   */
  async findById(id: number): Promise<RateLimitEntity | null> {
    return this.findOne({ id });
  }

  /**
   * Find rate limit by identifier and limit type
   */
  async findByIdentifierAndType(
    identifier: string,
    limitType: string,
  ): Promise<RateLimitEntity | null> {
    return this.findOne({ identifier, limitType });
  }

  /**
   * Find rate limit by identifier, limit type, and scope
   */
  async findByIdentifierTypeAndScope(
    identifier: string,
    limitType: string,
    scope: string,
  ): Promise<RateLimitEntity | null> {
    return this.findOne({ identifier, limitType, scope });
  }

  /**
   * Find all rate limits for a specific identifier
   */
  async findByIdentifier(identifier: string): Promise<RateLimitEntity[]> {
    return this.find({ identifier });
  }

  /**
   * Find all rate limits for a specific limit type
   */
  async findByLimitType(limitType: string): Promise<RateLimitEntity[]> {
    return this.find({ limitType });
  }

  /**
   * Find all rate limits for a specific scope
   */
  async findByScope(scope: string): Promise<RateLimitEntity[]> {
    return this.find({ scope });
  }

  /**
   * Find all rate limits for a specific IP address
   */
  async findByIpAddress(ipAddress: string): Promise<RateLimitEntity[]> {
    return this.find({ ipAddress });
  }

  /**
   * Find currently blocked rate limits
   */
  async findBlocked(): Promise<RateLimitEntity[]> {
    return this.find({ blockedUntil: { $gt: new Date() } });
  }

  /**
   * Find expired rate limits (window has ended)
   */
  async findExpired(): Promise<RateLimitEntity[]> {
    return this.find({ windowEnd: { $lt: new Date() } });
  }

  /**
   * Find rate limits that need window reset
   */
  async findNeedingReset(): Promise<RateLimitEntity[]> {
    return this.find({ windowEnd: { $lt: new Date() } });
  }

  /**
   * Create a new rate limit record
   */
  async createRateLimit(rateLimitData: {
    identifier: string;
    limitType: string;
    scope: string;
    maxAttempts: number;
    windowSeconds: number;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }): Promise<RateLimitEntity> {
    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + rateLimitData.windowSeconds * 1000,
    );

    const rateLimit = this.create({
      ...rateLimitData,
      attempts: 0,
      windowStart: now,
      windowEnd: windowEnd,
      createdAt: now,
      updatedAt: now,
    });
    await this.em.persistAndFlush(rateLimit);
    return rateLimit;
  }

  /**
   * Update rate limit information
   */
  async updateRateLimit(
    id: number,
    rateLimitData: Partial<RateLimitEntity>,
  ): Promise<RateLimitEntity | null> {
    const rateLimit = await this.findOne({ id });
    if (!rateLimit) return null;

    this.assign(rateLimit, rateLimitData);
    await this.em.flush();
    return rateLimit;
  }

  /**
   * Increment attempts for a rate limit
   */
  async incrementAttempts(id: number): Promise<void> {
    const rateLimit = await this.findOne({ id });
    if (rateLimit) {
      rateLimit.attempts += 1;
      await this.em.flush();
    }
  }

  /**
   * Reset attempts for a rate limit
   */
  async resetAttempts(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { attempts: 0 });
  }

  /**
   * Block a rate limit until a specific time
   */
  async blockUntil(id: number, blockedUntil: Date): Promise<void> {
    await this.nativeUpdate({ id }, { blockedUntil: blockedUntil });
  }

  /**
   * Unblock a rate limit
   */
  async unblock(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { blockedUntil: null });
  }

  /**
   * Reset window for a rate limit
   */
  async resetWindow(id: number, windowSeconds: number): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

    await this.nativeUpdate(
      { id },
      {
        windowStart: now,
        windowEnd: windowEnd,
        attempts: 0,
        blockedUntil: null,
      },
    );
  }

  /**
   * Update IP address for a rate limit
   */
  async updateIpAddress(id: number, ipAddress: string): Promise<void> {
    await this.nativeUpdate({ id }, { ipAddress: ipAddress });
  }

  /**
   * Update metadata for a rate limit
   */
  async updateMetadata(
    id: number,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.nativeUpdate({ id }, { metadata: metadata });
  }

  /**
   * Check if an identifier is currently blocked
   */
  async isBlocked(identifier: string, limitType: string): Promise<boolean> {
    const rateLimit = await this.findOne({
      identifier,
      limitType,
      blockedUntil: { $gt: new Date() },
    });
    return !!rateLimit;
  }

  /**
   * Check if an identifier has exceeded the rate limit
   */
  async hasExceededLimit(
    identifier: string,
    limitType: string,
  ): Promise<boolean> {
    const rateLimit = await this.findOne({ identifier, limitType });
    if (!rateLimit) return false;

    return rateLimit.attempts >= rateLimit.maxAttempts;
  }

  /**
   * Get current attempt count for an identifier
   */
  async getAttemptCount(
    identifier: string,
    limitType: string,
  ): Promise<number> {
    const rateLimit = await this.findOne({ identifier, limitType });
    return rateLimit?.attempts || 0;
  }

  /**
   * Delete rate limit by ID
   */
  async deleteRateLimit(id: number): Promise<boolean> {
    const rateLimit = await this.findOne({ id });
    if (!rateLimit) return false;

    await this.em.removeAndFlush(rateLimit);
    return true;
  }

  /**
   * Delete all rate limits for a specific identifier
   */
  async deleteByIdentifier(identifier: string): Promise<number> {
    const result = await this.nativeDelete({ identifier });
    return result;
  }

  /**
   * Delete all rate limits for a specific limit type
   */
  async deleteByLimitType(limitType: string): Promise<number> {
    const result = await this.nativeDelete({ limitType });
    return result;
  }

  /**
   * Delete expired rate limits
   */
  async deleteExpired(): Promise<number> {
    const result = await this.nativeDelete({
      windowEnd: { $lt: new Date() },
    });
    return result;
  }

  /**
   * Delete unblocked rate limits (no longer blocked)
   */
  async deleteUnblocked(): Promise<number> {
    const result = await this.nativeDelete({
      $or: [{ blockedUntil: null }, { blockedUntil: { $lt: new Date() } }],
    });
    return result;
  }

  /**
   * Count rate limits for a specific identifier
   */
  async countByIdentifier(identifier: string): Promise<number> {
    return this.count({ identifier });
  }

  /**
   * Count rate limits for a specific limit type
   */
  async countByLimitType(limitType: string): Promise<number> {
    return this.count({ limitType });
  }

  /**
   * Count rate limits for a specific scope
   */
  async countByScope(scope: string): Promise<number> {
    return this.count({ scope });
  }

  /**
   * Count currently blocked rate limits
   */
  async countBlocked(): Promise<number> {
    return this.count({ blockedUntil: { $gt: new Date() } });
  }

  /**
   * Count expired rate limits
   */
  async countExpired(): Promise<number> {
    return this.count({ windowEnd: { $lt: new Date() } });
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(): Promise<{
    total: number;
    blocked: number;
    expired: number;
    byScope: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [total, blocked, expired] = await Promise.all([
      this.count({}),
      this.countBlocked(),
      this.countExpired(),
    ]);

    // Get counts by scope
    const scopeStats = await this.em.execute(`
      SELECT scope, COUNT(*) as count
      FROM rate_limits
      GROUP BY scope
    `);

    // Get counts by limit type
    const typeStats = await this.em.execute(`
      SELECT limit_type, COUNT(*) as count
      FROM rate_limits
      GROUP BY limit_type
    `);

    const byScope: Record<string, number> = {};
    const byType: Record<string, number> = {};

    scopeStats.forEach((stat: any) => {
      byScope[stat.scope] = parseInt(stat.count);
    });

    typeStats.forEach((stat: any) => {
      byType[stat.limit_type] = parseInt(stat.count);
    });

    return {
      total,
      blocked,
      expired,
      byScope,
      byType,
    };
  }

  /**
   * Find rate limits by multiple criteria
   */
  async findByCriteria(criteria: {
    identifier?: string;
    limitType?: string;
    scope?: string;
    ipAddress?: string;
    isBlocked?: boolean;
    windowStartAfter?: Date;
    windowStartBefore?: Date;
    attemptsMin?: number;
    attemptsMax?: number;
  }): Promise<RateLimitEntity[]> {
    const where: any = {};

    if (criteria.identifier) where.identifier = criteria.identifier;
    if (criteria.limitType) where.limitType = criteria.limitType;
    if (criteria.scope) where.scope = criteria.scope;
    if (criteria.ipAddress) where.ipAddress = criteria.ipAddress;

    if (criteria.isBlocked !== undefined) {
      if (criteria.isBlocked) {
        where.blockedUntil = { $gt: new Date() };
      } else {
        where.$or = [
          { blockedUntil: null },
          { blockedUntil: { $lt: new Date() } },
        ];
      }
    }

    if (criteria.windowStartAfter || criteria.windowStartBefore) {
      where.windowStart = {};
      if (criteria.windowStartAfter)
        where.windowStart.$gte = criteria.windowStartAfter;
      if (criteria.windowStartBefore)
        where.windowStart.$lt = criteria.windowStartBefore;
    }

    if (
      criteria.attemptsMin !== undefined ||
      criteria.attemptsMax !== undefined
    ) {
      where.attempts = {};
      if (criteria.attemptsMin !== undefined)
        where.attempts.$gte = criteria.attemptsMin;
      if (criteria.attemptsMax !== undefined)
        where.attempts.$lte = criteria.attemptsMax;
    }

    return this.find(where);
  }

  /**
   * Bulk update rate limits
   */
  async bulkUpdate(
    criteria: any,
    updates: Partial<RateLimitEntity>,
  ): Promise<number> {
    const result = await this.nativeUpdate(criteria, updates);
    return result;
  }

  /**
   * Get rate limits with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: {
      identifier?: string;
      limitType?: string;
      scope?: string;
      isBlocked?: boolean;
    },
  ): Promise<{
    rateLimits: RateLimitEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.identifier) where.identifier = filters.identifier;
    if (filters?.limitType) where.limitType = filters.limitType;
    if (filters?.scope) where.scope = filters.scope;
    if (filters?.isBlocked !== undefined) {
      if (filters.isBlocked) {
        where.blockedUntil = { $gt: new Date() };
      } else {
        where.$or = [
          { blockedUntil: null },
          { blockedUntil: { $lt: new Date() } },
        ];
      }
    }

    const [rateLimits, total] = await Promise.all([
      this.find(where, { limit, offset, orderBy: { createdAt: 'DESC' } }),
      this.count(where),
    ]);

    return {
      rateLimits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Clean up old rate limit records
   */
  async cleanupOldRecords(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.nativeDelete({
      createdAt: { $lt: cutoffDate },
    });
    return result;
  }

  /**
   * Reset all expired windows
   */
  async resetExpiredWindows(): Promise<number> {
    const expiredRateLimits = await this.findExpired();
    let resetCount = 0;

    for (const rateLimit of expiredRateLimits) {
      const now = new Date();
      const windowEnd = new Date(
        now.getTime() + rateLimit.windowSeconds * 1000,
      );

      await this.nativeUpdate(
        { id: rateLimit.id },
        {
          windowStart: now,
          windowEnd: windowEnd,
          attempts: 0,
          blockedUntil: null,
        },
      );
      resetCount++;
    }

    return resetCount;
  }
}
