import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  SessionArchiveEntity,
  SessionArchiveRepository,
  SessionEntity,
  SessionRepository,
  SessionTerminationReason,
} from '@app/db';

@Injectable()
export class SessionArchiveService {
  private readonly logger = new Logger(SessionArchiveService.name);

  constructor(
    private readonly sessionArchiveRepo: SessionArchiveRepository,
    private readonly sessionRepo: SessionRepository,
  ) {}

  /**
   * Archive terminated sessions to improve performance
   * Moves terminated sessions from sessions table to session_archives table
   * @param options - Archiving options
   * @returns archiving statistics
   */
  async archiveTerminatedSessions(
    options: {
      maxTerminatedDays?: number;
      batchSize?: number;
      dryRun?: boolean;
    } = {},
  ): Promise<{
    archivedCount: number;
    skippedCount: number;
    dryRun: boolean;
  }> {
    const {
      maxTerminatedDays = 7, // Archive sessions terminated more than 7 days ago
      batchSize = 100,
      dryRun = false,
    } = options;

    this.logger.log('Starting session archiving process', {
      maxTerminatedDays,
      batchSize,
      dryRun,
    });

    const cutoffDate = new Date(
      Date.now() - maxTerminatedDays * 24 * 60 * 60 * 1000,
    );

    let archivedCount = 0;
    let skippedCount = 0;

    try {
      // Get terminated sessions older than cutoff date using repository
      const terminatedSessions =
        await this.sessionRepo.findTerminatedSessionsOlderThan(cutoffDate);

      this.logger.log(
        `Found ${terminatedSessions.length} terminated sessions to archive`,
      );

      // Process in batches
      for (let i = 0; i < terminatedSessions.length; i += batchSize) {
        const batch = terminatedSessions.slice(i, i + batchSize);

        for (const session of batch) {
          try {
            if (!dryRun) {
              await this.archiveSession(session);
            }
            archivedCount++;
          } catch (error) {
            this.logger.error(`Failed to archive session ${session.id}`, error);
            skippedCount++;
          }
        }

        this.logger.log(
          `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(terminatedSessions.length / batchSize)}`,
        );
      }

      this.logger.log('Session archiving completed', {
        archivedCount,
        skippedCount,
        dryRun,
      });

      return {
        archivedCount,
        skippedCount,
        dryRun,
      };
    } catch (error) {
      this.logger.error('Session archiving failed', error);
      throw error;
    }
  }

  /**
   * Archive a single session
   * @param session - Session to archive
   */
  private async archiveSession(session: SessionEntity): Promise<void> {
    // Create archive record using repository
    const archive = await this.sessionArchiveRepo.createArchive({
      originalSessionId: session.sessionId,
      user: session.user,
      device: session.device,
      sessionId: session.sessionId,
      accessTokenHash: session.accessTokenHash,
      refreshTokenHash: session.refreshTokenHash,
      grantedPermissions: session.grantedPermissions,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      geoLocation: session.geoLocation,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
      maxExpiresAt: session.maxExpiresAt,
      terminatedAt: session.terminatedAt,
      terminationReason: session.terminationReason,
      isRemembered: session.isRemembered,
      archivedAt: new Date(),
      retentionDays: this.calculateRetentionDays(session.terminationReason),
      retentionExpiresAt: this.calculateRetentionExpiry(
        session.terminationReason,
      ),
    });

    // Delete original session using repository
    await this.sessionRepo.deleteSessionById(session.id);
  }

  /**
   * Calculate retention period based on termination reason
   * @param terminationReason - Reason for session termination
   * @returns retention period in days
   */
  private calculateRetentionDays(
    terminationReason: SessionTerminationReason | undefined,
  ): number {
    const retentionPolicies: Record<SessionTerminationReason, number> = {
      [SessionTerminationReason.LOGOUT]: 365, // 1 year for normal logout
      [SessionTerminationReason.TIMEOUT]: 730, // 2 years for timeout
      [SessionTerminationReason.REVOKED]: 1825, // 5 years for security revocations
      [SessionTerminationReason.DEVICE_REMOVED]: 1095, // 3 years for device removal
      [SessionTerminationReason.SESSION_LIMIT_ENFORCED]: 365, // 1 year for limit enforcement
      [SessionTerminationReason.ARCHIVED]: 2555, // 7 years for archived sessions
    };

    return terminationReason ? retentionPolicies[terminationReason] : 2555; // Default 7 years
  }

  /**
   * Calculate retention expiry date
   * @param terminationReason - Reason for session termination
   * @returns retention expiry date
   */
  private calculateRetentionExpiry(
    terminationReason: SessionTerminationReason | undefined,
  ): Date {
    const retentionDays = this.calculateRetentionDays(terminationReason);
    return new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);
  }

  /**
   * Clean up expired archives (beyond retention period)
   * @param options - Cleanup options
   * @returns cleanup statistics
   */
  async cleanupExpiredArchives(
    options: {
      dryRun?: boolean;
      batchSize?: number;
    } = {},
  ): Promise<{
    deletedCount: number;
    dryRun: boolean;
  }> {
    const { dryRun = false, batchSize = 100 } = options;

    this.logger.log('Starting expired archive cleanup', { dryRun, batchSize });

    let deletedCount = 0;

    try {
      if (dryRun) {
        // For dry run, just count expired archives
        const expiredArchives = await this.sessionArchiveRepo.findExpired();
        deletedCount = expiredArchives.length;

        this.logger.log(
          `Dry run: Found ${deletedCount} expired archives to delete`,
        );
      } else {
        // Use repository method to delete expired archives
        deletedCount = await this.sessionArchiveRepo.deleteExpired();

        this.logger.log(`Deleted ${deletedCount} expired archives`);
      }

      this.logger.log('Expired archive cleanup completed', {
        deletedCount,
        dryRun,
      });

      return {
        deletedCount,
        dryRun,
      };
    } catch (error) {
      this.logger.error('Expired archive cleanup failed', error);
      throw error;
    }
  }

  /**
   * Get archive statistics
   * @returns archive statistics
   */
  async getArchiveStats(): Promise<{
    totalArchives: number;
    archivesByReason: Record<string, number>;
    oldestArchive: Date | null;
    newestArchive: Date | null;
    retentionExpiringSoon: number;
  }> {
    try {
      return await this.sessionArchiveRepo.getArchiveStats();
    } catch (error) {
      this.logger.error('Failed to get archive statistics', error);
      throw error;
    }
  }

  /**
   * Restore archived session (for audit purposes)
   * @param originalSessionId - Original session ID to restore
   * @returns restored session or null if not found
   */
  async restoreArchivedSession(
    originalSessionId: string,
  ): Promise<SessionEntity | null> {
    try {
      const archive =
        await this.sessionArchiveRepo.findByOriginalSessionId(
          originalSessionId,
        );

      if (!archive) {
        return null;
      }

      // Create new session from archive using repository
      const restoredSession = await this.sessionRepo.createSessionFromArchive({
        user: archive.user,
        device: archive.device,
        sessionId: archive.sessionId,
        accessTokenHash: archive.accessTokenHash,
        refreshTokenHash: archive.refreshTokenHash,
        grantedPermissions: archive.grantedPermissions,
        userAgent: archive.userAgent,
        ipAddress: archive.ipAddress,
        geoLocation: archive.geoLocation,
        createdAt: archive.createdAt,
        lastActivityAt: archive.lastActivityAt,
        expiresAt: archive.expiresAt,
        maxExpiresAt: archive.maxExpiresAt,
        terminatedAt: archive.terminatedAt,
        terminationReason: archive.terminationReason,
        isRemembered: archive.isRemembered,
      });

      this.logger.log(`Restored archived session ${originalSessionId}`);

      return restoredSession;
    } catch (error) {
      this.logger.error(
        `Failed to restore archived session ${originalSessionId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Daily archiving of terminated sessions
   * Runs every day at 3:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleDailySessionArchiving() {
    this.logger.log('Starting daily session archiving...');

    try {
      const result = await this.archiveTerminatedSessions({
        maxTerminatedDays: 7, // Archive sessions terminated more than 7 days ago
        batchSize: 100,
        dryRun: false,
      });

      this.logger.log('Daily session archiving completed', {
        archivedCount: result.archivedCount,
        skippedCount: result.skippedCount,
      });
    } catch (error) {
      this.logger.error('Daily session archiving failed', error);
    }
  }

  /**
   * Monthly cleanup of expired archives
   * Runs on the first day of each month at 4:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM) // First day of month at 4:00 AM
  async handleMonthlyArchiveCleanup() {
    this.logger.log('Starting monthly archive cleanup...');

    try {
      const result = await this.cleanupExpiredArchives({
        dryRun: false,
        batchSize: 100,
      });

      this.logger.log('Monthly archive cleanup completed', {
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      this.logger.error('Monthly archive cleanup failed', error);
    }
  }

  /**
   * Get archives by user ID
   * @param userId - User ID to find archives for
   * @returns array of archived sessions for the user
   */
  async getArchivesByUser(userId: number): Promise<SessionArchiveEntity[]> {
    try {
      return await this.sessionArchiveRepo.findByUser(userId);
    } catch (error) {
      this.logger.error(`Failed to get archives for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Get archives by device ID
   * @param deviceId - Device ID to find archives for
   * @returns array of archived sessions for the device
   */
  async getArchivesByDevice(deviceId: number): Promise<SessionArchiveEntity[]> {
    try {
      return await this.sessionArchiveRepo.findByDevice(deviceId);
    } catch (error) {
      this.logger.error(`Failed to get archives for device ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * Get archives by termination reason
   * @param reason - Termination reason to filter by
   * @returns array of archived sessions with the specified termination reason
   */
  async getArchivesByTerminationReason(
    reason: SessionTerminationReason,
  ): Promise<SessionArchiveEntity[]> {
    try {
      return await this.sessionArchiveRepo.findByTerminationReason(reason);
    } catch (error) {
      this.logger.error(
        `Failed to get archives for termination reason ${reason}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get archives by date range
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @returns array of archived sessions within the date range
   */
  async getArchivesByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<SessionArchiveEntity[]> {
    try {
      return await this.sessionArchiveRepo.findByDateRange(startDate, endDate);
    } catch (error) {
      this.logger.error(
        `Failed to get archives for date range ${startDate} to ${endDate}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get archives by user and date range
   * @param userId - User ID to filter by
   * @param startDate - Start date for the range
   * @param endDate - End date for the range
   * @returns array of archived sessions for the user within the date range
   */
  async getArchivesByUserAndDateRange(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<SessionArchiveEntity[]> {
    try {
      return await this.sessionArchiveRepo.findByUserAndDateRange(
        userId,
        startDate,
        endDate,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get archives for user ${userId} in date range ${startDate} to ${endDate}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get archives with user and device data populated
   * @param options - Search options
   * @returns array of archived sessions with populated user and device data
   */
  async getArchivesWithUserAndDevice(
    options: {
      userId?: number;
      deviceId?: number;
      terminationReason?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<SessionArchiveEntity[]> {
    try {
      return await this.sessionArchiveRepo.findWithUserAndDevice(options);
    } catch (error) {
      this.logger.error(
        'Failed to get archives with user and device data',
        error,
      );
      throw error;
    }
  }

  /**
   * Get archive summary for dashboard
   * @returns archive summary statistics
   */
  async getArchiveSummary(): Promise<{
    totalArchives: number;
    archivesThisMonth: number;
    archivesThisYear: number;
    expiringThisMonth: number;
    expiringThisYear: number;
    topTerminationReasons: Array<{ reason: string; count: number }>;
  }> {
    try {
      return await this.sessionArchiveRepo.getArchiveSummary();
    } catch (error) {
      this.logger.error('Failed to get archive summary', error);
      throw error;
    }
  }

  /**
   * Get count of archives by termination reason
   * @param reason - Termination reason to count
   * @returns count of archives with the specified termination reason
   */
  async getArchiveCountByTerminationReason(
    reason: SessionTerminationReason,
  ): Promise<number> {
    try {
      return await this.sessionArchiveRepo.getCountByTerminationReason(reason);
    } catch (error) {
      this.logger.error(
        `Failed to get archive count for termination reason ${reason}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get count of archives by user
   * @param userId - User ID to count archives for
   * @returns count of archives for the user
   */
  async getArchiveCountByUser(userId: number): Promise<number> {
    try {
      return await this.sessionArchiveRepo.getCountByUser(userId);
    } catch (error) {
      this.logger.error(
        `Failed to get archive count for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get count of archives by device
   * @param deviceId - Device ID to count archives for
   * @returns count of archives for the device
   */
  async getArchiveCountByDevice(deviceId: number): Promise<number> {
    try {
      return await this.sessionArchiveRepo.getCountByDevice(deviceId);
    } catch (error) {
      this.logger.error(
        `Failed to get archive count for device ${deviceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Find archives expiring soon
   * @param days - Number of days to look ahead (default: 30)
   * @returns array of archives expiring within the specified days
   */
  async getArchivesExpiringSoon(
    days: number = 30,
  ): Promise<SessionArchiveEntity[]> {
    try {
      return await this.sessionArchiveRepo.findExpiringSoon(days);
    } catch (error) {
      this.logger.error(
        `Failed to get archives expiring within ${days} days`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete archives by user ID
   * @param userId - User ID to delete archives for
   * @returns number of deleted archives
   */
  async deleteArchivesByUser(userId: number): Promise<number> {
    try {
      const deletedCount = await this.sessionArchiveRepo.deleteByUser(userId);
      this.logger.log(`Deleted ${deletedCount} archives for user ${userId}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to delete archives for user ${userId}`, error);
      throw error;
    }
  }

  /**
   * Delete archives by device ID
   * @param deviceId - Device ID to delete archives for
   * @returns number of deleted archives
   */
  async deleteArchivesByDevice(deviceId: number): Promise<number> {
    try {
      const deletedCount =
        await this.sessionArchiveRepo.deleteByDevice(deviceId);
      this.logger.log(
        `Deleted ${deletedCount} archives for device ${deviceId}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete archives for device ${deviceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete archives by termination reason
   * @param reason - Termination reason to delete archives for
   * @returns number of deleted archives
   */
  async deleteArchivesByTerminationReason(
    reason: SessionTerminationReason,
  ): Promise<number> {
    try {
      const deletedCount =
        await this.sessionArchiveRepo.deleteByTerminationReason(reason);
      this.logger.log(
        `Deleted ${deletedCount} archives for termination reason ${reason}`,
      );
      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete archives for termination reason ${reason}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update archive retention period
   * @param archiveId - Archive ID to update
   * @param retentionDays - New retention period in days
   * @returns updated archive
   */
  async updateArchiveRetention(
    archiveId: bigint,
    retentionDays: number,
  ): Promise<SessionArchiveEntity> {
    try {
      const retentionExpiresAt = new Date(
        Date.now() + retentionDays * 24 * 60 * 60 * 1000,
      );

      const updatedArchive = await this.sessionArchiveRepo.updateArchive(
        archiveId,
        {
          retentionDays,
          retentionExpiresAt,
        },
      );

      this.logger.log(
        `Updated retention for archive ${archiveId} to ${retentionDays} days`,
      );
      return updatedArchive;
    } catch (error) {
      this.logger.error(
        `Failed to update retention for archive ${archiveId}`,
        error,
      );
      throw error;
    }
  }
}
