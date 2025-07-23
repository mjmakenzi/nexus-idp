import { EntityRepository } from '@mikro-orm/postgresql';
import { SecurityEventEntity } from '../entities/security-event.entity';
import { UserEntity } from '../entities/user.entity';

export class SecurityEventRepository extends EntityRepository<SecurityEventEntity> {
  /**
   * Find security event by ID
   */
  async findById(id: number): Promise<SecurityEventEntity | null> {
    return this.findOne({ id });
  }

  /**
   * Find security events by user ID
   */
  async findByUser(userId: number): Promise<SecurityEventEntity[]> {
    return this.find({ user: userId });
  }

  /**
   * Find security events by event type
   */
  async findByEventType(eventType: string): Promise<SecurityEventEntity[]> {
    return this.find({ eventType });
  }

  /**
   * Find security events by event category
   */
  async findByEventCategory(
    eventCategory: string,
  ): Promise<SecurityEventEntity[]> {
    return this.find({ eventCategory });
  }

  /**
   * Find security events by severity level
   */
  async findBySeverity(severity: string): Promise<SecurityEventEntity[]> {
    return this.find({ severity });
  }

  /**
   * Find security events by IP address
   */
  async findByIpAddress(ipAddress: string): Promise<SecurityEventEntity[]> {
    return this.find({ ipAddress });
  }

  /**
   * Find security events by session ID
   */
  async findBySessionId(sessionId: string): Promise<SecurityEventEntity[]> {
    return this.find({ sessionId });
  }

  /**
   * Find security events that require action
   */
  async findRequiringAction(): Promise<SecurityEventEntity[]> {
    return this.find({ requiresAction: true, isResolved: false });
  }

  /**
   * Find unresolved security events
   */
  async findUnresolved(): Promise<SecurityEventEntity[]> {
    return this.find({ isResolved: false });
  }

  /**
   * Find resolved security events
   */
  async findResolved(): Promise<SecurityEventEntity[]> {
    return this.find({ isResolved: true });
  }

  /**
   * Find security events that occurred after a specific date
   */
  async findAfterDate(date: Date): Promise<SecurityEventEntity[]> {
    return this.find({ occurredAt: { $gte: date } });
  }

  /**
   * Find security events that occurred before a specific date
   */
  async findBeforeDate(date: Date): Promise<SecurityEventEntity[]> {
    return this.find({ occurredAt: { $lt: date } });
  }

  /**
   * Find security events within a date range
   */
  async findInDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SecurityEventEntity[]> {
    return this.find({
      occurredAt: {
        $gte: startDate,
        $lt: endDate,
      },
    });
  }

  /**
   * Find high severity security events
   */
  async findHighSeverity(): Promise<SecurityEventEntity[]> {
    return this.find({
      severity: { $in: ['high', 'critical'] },
    });
  }

  /**
   * Find security events by user agent
   */
  async findByUserAgent(userAgent: string): Promise<SecurityEventEntity[]> {
    return this.find({ userAgent });
  }

  /**
   * Create a new security event
   */
  async createSecurityEvent(securityEventData: {
    user?: UserEntity;
    eventType: string;
    eventCategory: string;
    severity: string;
    riskScore?: string;
    eventData?: Record<string, unknown>;
    ipAddress?: string;
    geoLocation?: Record<string, unknown>;
    userAgent?: string;
    sessionId?: string;
    occurredAt?: Date;
    requiresAction?: boolean;
  }): Promise<SecurityEventEntity> {
    const securityEvent = this.create({
      ...securityEventData,
      occurredAt: securityEventData.occurredAt || new Date(),
      requiresAction: securityEventData.requiresAction ?? false,
      isResolved: false,
    });
    await this.em.persistAndFlush(securityEvent);
    return securityEvent;
  }

  /**
   * Update security event information
   */
  async updateSecurityEvent(
    id: number,
    securityEventData: Partial<SecurityEventEntity>,
  ): Promise<SecurityEventEntity | null> {
    const securityEvent = await this.findOne({ id });
    if (!securityEvent) return null;

    this.assign(securityEvent, securityEventData);
    await this.em.flush();
    return securityEvent;
  }

  /**
   * Mark security event as requiring action
   */
  async markAsRequiringAction(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { requiresAction: true });
  }

  /**
   * Mark security event as not requiring action
   */
  async markAsNotRequiringAction(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { requiresAction: false });
  }

  /**
   * Mark security event as resolved
   */
  async markAsResolved(id: number, resolvedBy: string): Promise<void> {
    await this.nativeUpdate(
      { id },
      {
        isResolved: true,
        resolvedBy: resolvedBy,
        resolvedAt: new Date(),
        requiresAction: false,
      },
    );
  }

  /**
   * Mark security event as unresolved
   */
  async markAsUnresolved(id: number): Promise<void> {
    await this.nativeUpdate(
      { id },
      {
        isResolved: false,
        resolvedBy: null,
        resolvedAt: null,
      },
    );
  }

  /**
   * Update risk score for a security event
   */
  async updateRiskScore(id: number, riskScore: string): Promise<void> {
    await this.nativeUpdate({ id }, { riskScore: riskScore });
  }

  /**
   * Update event data for a security event
   */
  async updateEventData(
    id: number,
    eventData: Record<string, unknown>,
  ): Promise<void> {
    await this.nativeUpdate({ id }, { eventData: eventData });
  }

  /**
   * Update geographic location for a security event
   */
  async updateGeoLocation(
    id: number,
    geoLocation: Record<string, unknown>,
  ): Promise<void> {
    await this.nativeUpdate({ id }, { geoLocation: geoLocation });
  }

  /**
   * Delete security event by ID
   */
  async deleteSecurityEvent(id: number): Promise<boolean> {
    const securityEvent = await this.findOne({ id });
    if (!securityEvent) return false;

    await this.em.removeAndFlush(securityEvent);
    return true;
  }

  /**
   * Delete all security events for a specific user
   */
  async deleteByUser(userId: number): Promise<number> {
    const result = await this.nativeDelete({ user: userId });
    return result;
  }

  /**
   * Delete all security events for a specific event type
   */
  async deleteByEventType(eventType: string): Promise<number> {
    const result = await this.nativeDelete({ eventType });
    return result;
  }

  /**
   * Delete old security events (older than specified days)
   */
  async deleteOldEvents(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.nativeDelete({
      occurredAt: { $lt: cutoffDate },
    });
    return result;
  }

  /**
   * Count security events for a specific user
   */
  async countByUser(userId: number): Promise<number> {
    return this.count({ user: userId });
  }

  /**
   * Count security events by event type
   */
  async countByEventType(eventType: string): Promise<number> {
    return this.count({ eventType });
  }

  /**
   * Count security events by event category
   */
  async countByEventCategory(eventCategory: string): Promise<number> {
    return this.count({ eventCategory });
  }

  /**
   * Count security events by severity level
   */
  async countBySeverity(severity: string): Promise<number> {
    return this.count({ severity });
  }

  /**
   * Count security events that require action
   */
  async countRequiringAction(): Promise<number> {
    return this.count({ requiresAction: true, isResolved: false });
  }

  /**
   * Count unresolved security events
   */
  async countUnresolved(): Promise<number> {
    return this.count({ isResolved: false });
  }

  /**
   * Count high severity security events
   */
  async countHighSeverity(): Promise<number> {
    return this.count({
      severity: { $in: ['high', 'critical'] },
    });
  }

  /**
   * Count security events by IP address
   */
  async countByIpAddress(ipAddress: string): Promise<number> {
    return this.count({ ipAddress });
  }

  /**
   * Get security event statistics
   */
  async getSecurityEventStats(): Promise<{
    total: number;
    requiringAction: number;
    unresolved: number;
    highSeverity: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [total, requiringAction, unresolved, highSeverity] =
      await Promise.all([
        this.count({}),
        this.countRequiringAction(),
        this.countUnresolved(),
        this.countHighSeverity(),
      ]);

    // Get counts by category
    const categoryStats = await this.em.execute(`
      SELECT event_category, COUNT(*) as count
      FROM security_events
      GROUP BY event_category
    `);

    // Get counts by severity
    const severityStats = await this.em.execute(`
      SELECT severity, COUNT(*) as count
      FROM security_events
      GROUP BY severity
    `);

    // Get counts by event type
    const typeStats = await this.em.execute(`
      SELECT event_type, COUNT(*) as count
      FROM security_events
      GROUP BY event_type
    `);

    const byCategory: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    categoryStats.forEach((stat: any) => {
      byCategory[stat.event_category] = parseInt(stat.count);
    });

    severityStats.forEach((stat: any) => {
      bySeverity[stat.severity] = parseInt(stat.count);
    });

    typeStats.forEach((stat: any) => {
      byType[stat.event_type] = parseInt(stat.count);
    });

    return {
      total,
      requiringAction,
      unresolved,
      highSeverity,
      byCategory,
      bySeverity,
      byType,
    };
  }

  /**
   * Find security events by multiple criteria
   */
  async findByCriteria(criteria: {
    userId?: number;
    eventType?: string;
    eventCategory?: string;
    severity?: string;
    ipAddress?: string;
    sessionId?: string;
    requiresAction?: boolean;
    isResolved?: boolean;
    occurredAfter?: Date;
    occurredBefore?: Date;
    riskScoreMin?: string;
    riskScoreMax?: string;
  }): Promise<SecurityEventEntity[]> {
    const where: any = {};

    if (criteria.userId) where.user = criteria.userId;
    if (criteria.eventType) where.eventType = criteria.eventType;
    if (criteria.eventCategory) where.eventCategory = criteria.eventCategory;
    if (criteria.severity) where.severity = criteria.severity;
    if (criteria.ipAddress) where.ipAddress = criteria.ipAddress;
    if (criteria.sessionId) where.sessionId = criteria.sessionId;
    if (criteria.requiresAction !== undefined)
      where.requiresAction = criteria.requiresAction;
    if (criteria.isResolved !== undefined)
      where.isResolved = criteria.isResolved;

    if (criteria.occurredAfter || criteria.occurredBefore) {
      where.occurredAt = {};
      if (criteria.occurredAfter)
        where.occurredAt.$gte = criteria.occurredAfter;
      if (criteria.occurredBefore)
        where.occurredAt.$lt = criteria.occurredBefore;
    }

    if (
      criteria.riskScoreMin !== undefined ||
      criteria.riskScoreMax !== undefined
    ) {
      where.riskScore = {};
      if (criteria.riskScoreMin !== undefined)
        where.riskScore.$gte = criteria.riskScoreMin;
      if (criteria.riskScoreMax !== undefined)
        where.riskScore.$lte = criteria.riskScoreMax;
    }

    return this.find(where);
  }

  /**
   * Bulk update security events
   */
  async bulkUpdate(
    criteria: any,
    updates: Partial<SecurityEventEntity>,
  ): Promise<number> {
    const result = await this.nativeUpdate(criteria, updates);
    return result;
  }

  /**
   * Get security events with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: {
      userId?: number;
      eventType?: string;
      eventCategory?: string;
      severity?: string;
      requiresAction?: boolean;
      isResolved?: boolean;
    },
  ): Promise<{
    securityEvents: SecurityEventEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.userId) where.user = filters.userId;
    if (filters?.eventType) where.eventType = filters.eventType;
    if (filters?.eventCategory) where.eventCategory = filters.eventCategory;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.requiresAction !== undefined)
      where.requiresAction = filters.requiresAction;
    if (filters?.isResolved !== undefined)
      where.isResolved = filters.isResolved;

    const [securityEvents, total] = await Promise.all([
      this.find(where, { limit, offset, orderBy: { occurredAt: 'DESC' } }),
      this.count(where),
    ]);

    return {
      securityEvents,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get recent security events for a user
   */
  async getRecentEventsForUser(
    userId: number,
    limit: number = 10,
  ): Promise<SecurityEventEntity[]> {
    return this.find(
      { user: userId },
      { limit, orderBy: { occurredAt: 'DESC' } },
    );
  }

  /**
   * Get security events by geographic location
   */
  async findByGeoLocation(
    country?: string,
    city?: string,
  ): Promise<SecurityEventEntity[]> {
    const where: any = {};

    if (country || city) {
      where.geoLocation = {};
      if (country) where.geoLocation.$like = `%${country}%`;
      if (city) where.geoLocation.$like = `%${city}%`;
    }

    return this.find(where);
  }

  /**
   * Get security events that occurred in the last N hours
   */
  async findRecentEvents(hours: number = 24): Promise<SecurityEventEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return this.find({
      occurredAt: { $gte: cutoffDate },
    });
  }

  /**
   * Get security events that need immediate attention (high severity, unresolved)
   */
  async findCriticalEvents(): Promise<SecurityEventEntity[]> {
    return this.find({
      severity: { $in: ['high', 'critical'] },
      isResolved: false,
    });
  }

  /**
   * Get security events by risk score range
   */
  async findByRiskScoreRange(
    minScore: string,
    maxScore: string,
  ): Promise<SecurityEventEntity[]> {
    return this.find({
      riskScore: {
        $gte: minScore,
        $lte: maxScore,
      },
    });
  }

  /**
   * Archive old security events (mark as resolved and move to archive)
   */
  async archiveOldEvents(olderThanDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.nativeUpdate(
      {
        occurredAt: { $lt: cutoffDate },
        isResolved: false,
      },
      {
        isResolved: true,
        resolvedBy: 'system',
        resolvedAt: new Date(),
        requiresAction: false,
      },
    );
    return result;
  }
}
