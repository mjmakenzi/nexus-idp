import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionRepository, SessionTerminationReason } from '@app/db';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly sessionRepo: SessionRepository) {}

  /**
   * Daily cleanup of orphaned sessions
   * Runs every day at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleDailySessionCleanup() {
    this.logger.log('Starting daily session cleanup...');

    try {
      const result = await this.cleanupOrphanedSessions({
        maxInactiveDays: 7, // Clean sessions inactive for 7+ days
        maxExpiredDays: 1, // Clean expired sessions older than 1 day
        dryRun: false,
      });

      this.logger.log('Daily session cleanup completed', {
        expiredSessions: result.expiredSessions,
        inactiveSessions: result.inactiveSessions,
        totalCleaned: result.totalCleaned,
      });

      // Log session health statistics
      const healthStats = await this.sessionRepo.getSessionHealthStats();
      this.logger.log('Session health statistics', {
        totalActiveSessions: healthStats.totalActiveSessions,
        totalExpiredSessions: healthStats.totalExpiredSessions,
        totalTerminatedSessions: healthStats.totalTerminatedSessions,
        orphanedSessions: healthStats.orphanedSessions,
      });
    } catch (error) {
      this.logger.error('Daily session cleanup failed', error);
    }
  }

  /**
   * Weekly deep cleanup of old terminated sessions
   * Runs every Sunday at 3:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyDeepCleanup() {
    this.logger.log('Starting weekly deep cleanup...');

    try {
      // Clean up very old inactive sessions (30+ days)
      const result = await this.cleanupOrphanedSessions({
        maxInactiveDays: 30, // Clean sessions inactive for 30+ days
        maxExpiredDays: 7, // Clean expired sessions older than 7 days
        dryRun: false,
      });

      this.logger.log('Weekly deep cleanup completed', {
        expiredSessions: result.expiredSessions,
        inactiveSessions: result.inactiveSessions,
        totalCleaned: result.totalCleaned,
      });
    } catch (error) {
      this.logger.error('Weekly deep cleanup failed', error);
    }
  }

  /**
   * Manual cleanup trigger
   * Can be called from admin panel or API
   */
  async triggerManualCleanup(
    options: {
      maxInactiveDays?: number;
      maxExpiredDays?: number;
      dryRun?: boolean;
    } = {},
  ) {
    this.logger.log('Manual session cleanup triggered', options);

    try {
      const result = await this.cleanupOrphanedSessions(options);

      this.logger.log('Manual session cleanup completed', {
        expiredSessions: result.expiredSessions,
        inactiveSessions: result.inactiveSessions,
        totalCleaned: result.totalCleaned,
        dryRun: result.dryRun,
      });

      return result;
    } catch (error) {
      this.logger.error('Manual session cleanup failed', error);
      throw error;
    }
  }

  /**
   * Get session health report
   * Can be called from admin panel or monitoring systems
   */
  async getSessionHealthReport() {
    try {
      const healthStats = await this.sessionRepo.getSessionHealthStats();

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalActiveSessions: healthStats.totalActiveSessions,
          totalExpiredSessions: healthStats.totalExpiredSessions,
          totalTerminatedSessions: healthStats.totalTerminatedSessions,
          orphanedSessions: healthStats.orphanedSessions,
        },
        details: {
          sessionsByUser: healthStats.sessionsByUser,
          sessionsByDevice: healthStats.sessionsByDevice,
        },
        recommendations: this.generateRecommendations(healthStats),
      };

      this.logger.log('Session health report generated', {
        totalActiveSessions: report.summary.totalActiveSessions,
        orphanedSessions: report.summary.orphanedSessions,
      });

      return report;
    } catch (error) {
      this.logger.error('Failed to generate session health report', error);
      throw error;
    }
  }

  /**
   * Clean up orphaned sessions (expired or inactive sessions)
   * This method handles sessions from users who removed the app without logout
   * @param options - Cleanup options
   * @returns cleanup statistics
   */
  async cleanupOrphanedSessions(
    options: {
      maxInactiveDays?: number;
      maxExpiredDays?: number;
      dryRun?: boolean;
    } = {},
  ): Promise<{
    expiredSessions: number;
    inactiveSessions: number;
    totalCleaned: number;
    dryRun: boolean;
  }> {
    const {
      maxInactiveDays = 7, // Sessions inactive for more than 7 days
      maxExpiredDays = 1, // Expired sessions older than 1 day
      dryRun = false,
    } = options;

    const now = new Date();
    const inactiveThreshold = new Date(
      now.getTime() - maxInactiveDays * 24 * 60 * 60 * 1000,
    );
    const expiredThreshold = new Date(
      now.getTime() - maxExpiredDays * 24 * 60 * 60 * 1000,
    );

    let expiredSessions = 0;
    let inactiveSessions = 0;

    // Clean up expired sessions using repository
    const expiredSessionsToClean =
      await this.sessionRepo.findExpiredSessionsForCleanup(expiredThreshold);

    if (!dryRun) {
      expiredSessions = await this.sessionRepo.terminateSessions(
        expiredSessionsToClean,
        SessionTerminationReason.TIMEOUT,
      );
    } else {
      expiredSessions = expiredSessionsToClean.length;
    }

    // Clean up inactive sessions using repository
    const inactiveSessionsToClean =
      await this.sessionRepo.findInactiveSessionsForCleanup(
        inactiveThreshold,
        now,
      );

    if (!dryRun) {
      inactiveSessions = await this.sessionRepo.terminateSessions(
        inactiveSessionsToClean,
        SessionTerminationReason.TIMEOUT,
      );
    } else {
      inactiveSessions = inactiveSessionsToClean.length;
    }

    const totalCleaned = expiredSessions + inactiveSessions;

    console.info('Session cleanup completed', {
      expiredSessions,
      inactiveSessions,
      totalCleaned,
      dryRun,
      maxInactiveDays,
      maxExpiredDays,
    });

    return {
      expiredSessions,
      inactiveSessions,
      totalCleaned,
      dryRun,
    };
  }

  /**
   * Generate recommendations based on session health
   */
  private generateRecommendations(healthStats: any): string[] {
    const recommendations: string[] = [];

    // Check for high orphaned sessions
    if (healthStats.orphanedSessions > 100) {
      recommendations.push(
        `High number of orphaned sessions (${healthStats.orphanedSessions}). Consider running cleanup.`,
      );
    }

    // Check for users with too many sessions
    const usersWithManySessions = healthStats.sessionsByUser.filter(
      (user: any) => user.sessionCount > 10,
    );

    if (usersWithManySessions.length > 0) {
      recommendations.push(
        `${usersWithManySessions.length} users have more than 10 active sessions. Consider reviewing session limits.`,
      );
    }

    // Check for devices with too many sessions
    const devicesWithManySessions = healthStats.sessionsByDevice.filter(
      (device: any) => device.sessionCount > 5,
    );

    if (devicesWithManySessions.length > 0) {
      recommendations.push(
        `${devicesWithManySessions.length} devices have more than 5 active sessions. Consider reviewing device session limits.`,
      );
    }

    // Check for expired sessions
    if (healthStats.totalExpiredSessions > 50) {
      recommendations.push(
        `High number of expired sessions (${healthStats.totalExpiredSessions}). Consider running cleanup.`,
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Session health looks good. No immediate action required.',
      );
    }

    return recommendations;
  }

  /**
   * Get session health statistics
   * @returns session health metrics
   */
  async getSessionHealthStats() {
    return await this.sessionRepo.getSessionHealthStats();
  }

  /**
   * Terminate all sessions for a specific user
   * @param userId - User ID
   * @param reason - Termination reason
   * @returns number of sessions terminated
   */
  async terminateAllUserSessions(
    userId: number,
    reason: SessionTerminationReason,
  ): Promise<number> {
    return await this.sessionRepo.terminateAllUserSessions(userId, reason);
  }

  /**
   * Terminate all sessions for a specific device
   * @param deviceId - Device ID
   * @param reason - Termination reason
   * @returns number of sessions terminated
   */
  async terminateAllDeviceSessions(
    deviceId: number,
    reason: SessionTerminationReason,
  ): Promise<number> {
    return await this.sessionRepo.terminateAllDeviceSessions(deviceId, reason);
  }
}
