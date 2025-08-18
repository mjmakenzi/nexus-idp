import { EntityRepository } from '@mikro-orm/postgresql';
import { SessionArchiveEntity } from '../entities/session-archive.entity';
import { SessionTerminationReason } from '../entities/session.entity';

export class SessionArchiveRepository extends EntityRepository<SessionArchiveEntity> {
  /**
   * Create and persist a new session archive
   */
  async createArchive(
    dto: Partial<SessionArchiveEntity>,
  ): Promise<SessionArchiveEntity> {
    const archiveEntity = await this.create(dto as SessionArchiveEntity);
    await this.em.persistAndFlush(archiveEntity);
    return archiveEntity;
  }

  /**
   * Update a session archive
   */
  async updateArchive(
    id: bigint,
    dto: Partial<SessionArchiveEntity>,
  ): Promise<SessionArchiveEntity> {
    const archive = await this.findOne({ id });
    if (!archive) {
      throw new Error('Session archive not found');
    }
    Object.assign(archive, dto);
    await this.em.flush();
    return archive;
  }

  /**
   * Find archive by original session ID
   */
  async findByOriginalSessionId(
    originalSessionId: string,
  ): Promise<SessionArchiveEntity | null> {
    return this.findOne({ originalSessionId });
  }

  /**
   * Find archives by user ID
   */
  async findByUser(userId: number): Promise<SessionArchiveEntity[]> {
    return this.find({ user: userId });
  }

  /**
   * Find archives by device ID
   */
  async findByDevice(deviceId: number): Promise<SessionArchiveEntity[]> {
    return this.find({ device: deviceId });
  }

  /**
   * Find archives by termination reason
   */
  async findByTerminationReason(
    reason: SessionTerminationReason,
  ): Promise<SessionArchiveEntity[]> {
    return this.find({ terminationReason: reason });
  }

  /**
   * Find archives that are expiring soon (within specified days)
   */
  async findExpiringSoon(days: number = 30): Promise<SessionArchiveEntity[]> {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.find({
      retentionExpiresAt: { $lt: cutoffDate },
    });
  }

  /**
   * Find expired archives (beyond retention period)
   */
  async findExpired(): Promise<SessionArchiveEntity[]> {
    const now = new Date();
    return this.find({
      retentionExpiresAt: { $lt: now },
    });
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<{
    totalArchives: number;
    archivesByReason: Record<string, number>;
    oldestArchive: Date | null;
    newestArchive: Date | null;
    retentionExpiringSoon: number;
  }> {
    const allArchives = await this.findAll();

    const archivesByReason = allArchives.reduce(
      (acc, archive) => {
        const reason = archive.terminationReason;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );

    const retentionExpiringSoon = allArchives.filter(
      (archive) => archive.retentionExpiresAt < thirtyDaysFromNow,
    ).length;

    const oldestArchive =
      allArchives.length > 0
        ? new Date(Math.min(...allArchives.map((a) => a.archivedAt.getTime())))
        : null;

    const newestArchive =
      allArchives.length > 0
        ? new Date(Math.max(...allArchives.map((a) => a.archivedAt.getTime())))
        : null;

    return {
      totalArchives: allArchives.length,
      archivesByReason,
      oldestArchive,
      newestArchive,
      retentionExpiringSoon,
    };
  }

  /**
   * Get archives by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SessionArchiveEntity[]> {
    return this.find({
      archivedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }

  /**
   * Get archives by user and date range
   */
  async findByUserAndDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<SessionArchiveEntity[]> {
    return this.find({
      user: userId,
      archivedAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }

  /**
   * Delete expired archives (beyond retention period)
   * Returns the number of deleted archives
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.nativeDelete({
      retentionExpiresAt: { $lt: now },
    });
    return result;
  }

  /**
   * Delete archives by user ID
   */
  async deleteByUser(userId: number): Promise<number> {
    const result = await this.nativeDelete({
      user: userId,
    });
    return result;
  }

  /**
   * Delete archives by device ID
   */
  async deleteByDevice(deviceId: number): Promise<number> {
    const result = await this.nativeDelete({
      device: deviceId,
    });
    return result;
  }

  /**
   * Delete archives by termination reason
   */
  async deleteByTerminationReason(
    reason: SessionTerminationReason,
  ): Promise<number> {
    const result = await this.nativeDelete({
      terminationReason: reason,
    });
    return result;
  }

  /**
   * Get archive count by termination reason
   */
  async getCountByTerminationReason(
    reason: SessionTerminationReason,
  ): Promise<number> {
    return this.count({ terminationReason: reason });
  }

  /**
   * Get archive count by user
   */
  async getCountByUser(userId: number): Promise<number> {
    return this.count({ user: userId });
  }

  /**
   * Get archive count by device
   */
  async getCountByDevice(deviceId: number): Promise<number> {
    return this.count({ device: deviceId });
  }

  /**
   * Get archives with user and device data populated
   */
  async findWithUserAndDevice(
    options: {
      userId?: number;
      deviceId?: number;
      terminationReason?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<SessionArchiveEntity[]> {
    const { userId, deviceId, terminationReason, limit, offset } = options;

    const where: any = {};
    if (userId) where.user = userId;
    if (deviceId) where.device = deviceId;
    if (terminationReason) where.terminationReason = terminationReason;

    return this.find(where, {
      populate: ['user', 'device'],
      limit,
      offset,
      orderBy: { archivedAt: 'DESC' },
    });
  }

  /**
   * Get archive summary for dashboard
   */
  async getArchiveSummary(): Promise<{
    totalArchives: number;
    archivesThisMonth: number;
    archivesThisYear: number;
    expiringThisMonth: number;
    expiringThisYear: number;
    topTerminationReasons: Array<{ reason: string; count: number }>;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    const [
      totalArchives,
      archivesThisMonth,
      archivesThisYear,
      expiringThisMonth,
      expiringThisYear,
    ] = await Promise.all([
      this.count({}),
      this.count({
        archivedAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      this.count({
        archivedAt: { $gte: startOfYear, $lte: endOfYear },
      }),
      this.count({
        retentionExpiresAt: { $gte: startOfMonth, $lte: endOfMonth },
      }),
      this.count({
        retentionExpiresAt: { $gte: startOfYear, $lte: endOfYear },
      }),
    ]);

    // Get top termination reasons
    const allArchives = await this.findAll();
    const reasonCounts = allArchives.reduce(
      (acc, archive) => {
        const reason = archive.terminationReason;
        acc[reason] = (acc[reason] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topTerminationReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalArchives,
      archivesThisMonth,
      archivesThisYear,
      expiringThisMonth,
      expiringThisYear,
      topTerminationReasons,
    };
  }
}
