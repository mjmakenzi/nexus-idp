import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  SessionArchiveService,
  SessionCleanupService,
} from '@app/shared-utils';

const PATH = 'sessions';

@Controller({ path: PATH })
export class AdminController {
  constructor(
    private readonly sessionCleanupService: SessionCleanupService,
    private readonly sessionArchiveService: SessionArchiveService,
  ) {}

  /**
   * Get session health statistics
   * GET /sessions/health
   */
  @Get('health')
  async getSessionHealth() {
    const healthStats =
      await this.sessionCleanupService.getSessionHealthStats();

    return {
      status: 'success',
      data: {
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
      },
    };
  }

  /**
   * Get detailed session health report with recommendations
   * GET /sessions/health-report
   */
  @Get('health-report')
  async getSessionHealthReport() {
    const report = await this.sessionCleanupService.getSessionHealthReport();

    return {
      status: 'success',
      data: report,
    };
  }

  /**
   * Trigger manual session cleanup
   * POST /sessions/cleanup
   */
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  async triggerCleanup(
    @Body()
    body: {
      maxInactiveDays?: number;
      maxExpiredDays?: number;
      dryRun?: boolean;
    } = {},
  ) {
    const result = await this.sessionCleanupService.triggerManualCleanup(body);

    return {
      status: 'success',
      data: {
        message: body.dryRun
          ? 'Cleanup simulation completed'
          : 'Session cleanup completed',
        result: {
          expiredSessions: result.expiredSessions,
          inactiveSessions: result.inactiveSessions,
          totalCleaned: result.totalCleaned,
          dryRun: result.dryRun,
        },
      },
    };
  }

  /**
   * Terminate all sessions for a specific user
   * POST /sessions/terminate-user
   */
  @Post('terminate-user')
  @HttpCode(HttpStatus.OK)
  async terminateUserSessions(
    @Body() body: { userId: number; reason?: string },
  ) {
    const terminatedCount =
      await this.sessionCleanupService.terminateAllUserSessions(
        body.userId,
        body.reason as any,
      );

    return {
      status: 'success',
      data: {
        message: `Terminated ${terminatedCount} sessions for user ${body.userId}`,
        terminatedCount,
        userId: body.userId,
      },
    };
  }

  /**
   * Terminate all sessions for a specific device
   * POST /sessions/terminate-device
   */
  @Post('terminate-device')
  @HttpCode(HttpStatus.OK)
  async terminateDeviceSessions(
    @Body() body: { deviceId: number; reason?: string },
  ) {
    const terminatedCount =
      await this.sessionCleanupService.terminateAllDeviceSessions(
        body.deviceId,
        body.reason as any,
      );

    return {
      status: 'success',
      data: {
        message: `Terminated ${terminatedCount} sessions for device ${body.deviceId}`,
        terminatedCount,
        deviceId: body.deviceId,
      },
    };
  }

  /**
   * Get cleanup simulation (dry run)
   * GET /sessions/cleanup-simulation
   */
  @Get('cleanup-simulation')
  async getCleanupSimulation(
    @Query('maxInactiveDays') maxInactiveDays?: string,
    @Query('maxExpiredDays') maxExpiredDays?: string,
  ) {
    const result = await this.sessionCleanupService.triggerManualCleanup({
      maxInactiveDays: maxInactiveDays ? parseInt(maxInactiveDays, 10) : 7,
      maxExpiredDays: maxExpiredDays ? parseInt(maxExpiredDays, 10) : 1,
      dryRun: true,
    });

    return {
      status: 'success',
      data: {
        message: 'Cleanup simulation completed',
        simulation: {
          expiredSessions: result.expiredSessions,
          inactiveSessions: result.inactiveSessions,
          totalCleaned: result.totalCleaned,
          dryRun: result.dryRun,
        },
        note: 'This was a simulation. No sessions were actually terminated.',
      },
    };
  }

  // ============================================================================
  // SESSION ARCHIVE ENDPOINTS
  // ============================================================================

  /**
   * Get session archive statistics
   * GET /sessions/archives/stats
   */
  @Get('archives/stats')
  async getArchiveStats() {
    const stats = await this.sessionArchiveService.getArchiveStats();

    return {
      status: 'success',
      data: stats,
    };
  }

  /**
   * Get session archive summary for dashboard
   * GET /sessions/archives/summary
   */
  @Get('archives/summary')
  async getArchiveSummary() {
    const summary = await this.sessionArchiveService.getArchiveSummary();

    return {
      status: 'success',
      data: summary,
    };
  }

  /**
   * Get archives by user ID
   * GET /sessions/archives/user/:userId
   */
  @Get('archives/user/:userId')
  async getArchivesByUser(@Param('userId') userId: string) {
    const archives = await this.sessionArchiveService.getArchivesByUser(
      parseInt(userId, 10),
    );

    return {
      status: 'success',
      data: archives,
    };
  }

  /**
   * Get archives by device ID
   * GET /sessions/archives/device/:deviceId
   */
  @Get('archives/device/:deviceId')
  async getArchivesByDevice(@Param('deviceId') deviceId: string) {
    const archives = await this.sessionArchiveService.getArchivesByDevice(
      parseInt(deviceId, 10),
    );

    return {
      status: 'success',
      data: archives,
    };
  }

  /**
   * Get archives by termination reason
   * GET /sessions/archives/reason/:reason
   */
  @Get('archives/reason/:reason')
  async getArchivesByTerminationReason(@Param('reason') reason: string) {
    const archives =
      await this.sessionArchiveService.getArchivesByTerminationReason(
        reason as any,
      );

    return {
      status: 'success',
      data: archives,
    };
  }

  /**
   * Get archives by date range
   * GET /sessions/archives/date-range
   */
  @Get('archives/date-range')
  async getArchivesByDateRange(
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    const archives = await this.sessionArchiveService.getArchivesByDateRange(
      new Date(startDate),
      new Date(endDate),
    );

    return {
      status: 'success',
      data: archives,
    };
  }

  /**
   * Get archives by user and date range
   * GET /sessions/archives/user/:userId/date-range
   */
  @Get('archives/user/:userId/date-range')
  async getArchivesByUserAndDateRange(
    @Param('userId') userId: string,
    @Query('start') startDate: string,
    @Query('end') endDate: string,
  ) {
    const archives =
      await this.sessionArchiveService.getArchivesByUserAndDateRange(
        parseInt(userId, 10),
        new Date(startDate),
        new Date(endDate),
      );

    return {
      status: 'success',
      data: archives,
    };
  }

  /**
   * Get archives with user and device data populated
   * GET /sessions/archives/with-details
   */
  @Get('archives/with-details')
  async getArchivesWithUserAndDevice(
    @Query('userId') userId?: string,
    @Query('deviceId') deviceId?: string,
    @Query('terminationReason') terminationReason?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const archives =
      await this.sessionArchiveService.getArchivesWithUserAndDevice({
        userId: userId ? parseInt(userId, 10) : undefined,
        deviceId: deviceId ? parseInt(deviceId, 10) : undefined,
        terminationReason,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      });

    return {
      status: 'success',
      data: archives,
    };
  }

  /**
   * Get archives expiring soon
   * GET /sessions/archives/expiring-soon
   */
  @Get('archives/expiring-soon')
  async getArchivesExpiringSoon(@Query('days') days?: string) {
    const archives = await this.sessionArchiveService.getArchivesExpiringSoon(
      days ? parseInt(days, 10) : 30,
    );

    return {
      status: 'success',
      data: archives,
    };
  }

  /**
   * Get archive count by termination reason
   * GET /sessions/archives/count/reason/:reason
   */
  @Get('archives/count/reason/:reason')
  async getArchiveCountByTerminationReason(@Param('reason') reason: string) {
    const count =
      await this.sessionArchiveService.getArchiveCountByTerminationReason(
        reason as any,
      );

    return {
      status: 'success',
      data: { count, reason },
    };
  }

  /**
   * Get archive count by user
   * GET /sessions/archives/count/user/:userId
   */
  @Get('archives/count/user/:userId')
  async getArchiveCountByUser(@Param('userId') userId: string) {
    const count = await this.sessionArchiveService.getArchiveCountByUser(
      parseInt(userId, 10),
    );

    return {
      status: 'success',
      data: { count, userId: parseInt(userId, 10) },
    };
  }

  /**
   * Get archive count by device
   * GET /sessions/archives/count/device/:deviceId
   */
  @Get('archives/count/device/:deviceId')
  async getArchiveCountByDevice(@Param('deviceId') deviceId: string) {
    const count = await this.sessionArchiveService.getArchiveCountByDevice(
      parseInt(deviceId, 10),
    );

    return {
      status: 'success',
      data: { count, deviceId: parseInt(deviceId, 10) },
    };
  }

  /**
   * Delete archives by user ID
   * POST /sessions/archives/delete/user
   */
  @Post('archives/delete/user')
  @HttpCode(HttpStatus.OK)
  async deleteArchivesByUser(@Body() body: { userId: number }) {
    const deletedCount = await this.sessionArchiveService.deleteArchivesByUser(
      body.userId,
    );

    return {
      status: 'success',
      data: {
        message: `Deleted ${deletedCount} archives for user ${body.userId}`,
        deletedCount,
        userId: body.userId,
      },
    };
  }

  /**
   * Delete archives by device ID
   * POST /sessions/archives/delete/device
   */
  @Post('archives/delete/device')
  @HttpCode(HttpStatus.OK)
  async deleteArchivesByDevice(@Body() body: { deviceId: number }) {
    const deletedCount =
      await this.sessionArchiveService.deleteArchivesByDevice(body.deviceId);

    return {
      status: 'success',
      data: {
        message: `Deleted ${deletedCount} archives for device ${body.deviceId}`,
        deletedCount,
        deviceId: body.deviceId,
      },
    };
  }

  /**
   * Delete archives by termination reason
   * POST /sessions/archives/delete/reason
   */
  @Post('archives/delete/reason')
  @HttpCode(HttpStatus.OK)
  async deleteArchivesByTerminationReason(@Body() body: { reason: string }) {
    const deletedCount =
      await this.sessionArchiveService.deleteArchivesByTerminationReason(
        body.reason as any,
      );

    return {
      status: 'success',
      data: {
        message: `Deleted ${deletedCount} archives for termination reason ${body.reason}`,
        deletedCount,
        reason: body.reason,
      },
    };
  }

  /**
   * Update archive retention period
   * POST /sessions/archives/update-retention
   */
  @Post('archives/update-retention')
  @HttpCode(HttpStatus.OK)
  async updateArchiveRetention(
    @Body() body: { archiveId: string; retentionDays: number },
  ) {
    const updatedArchive =
      await this.sessionArchiveService.updateArchiveRetention(
        BigInt(body.archiveId),
        body.retentionDays,
      );

    return {
      status: 'success',
      data: {
        message: `Updated retention for archive ${body.archiveId} to ${body.retentionDays} days`,
        archive: updatedArchive,
      },
    };
  }

  /**
   * Restore archived session (for audit purposes)
   * POST /sessions/archives/restore
   */
  @Post('archives/restore')
  @HttpCode(HttpStatus.OK)
  async restoreArchivedSession(@Body() body: { originalSessionId: string }) {
    const restoredSession =
      await this.sessionArchiveService.restoreArchivedSession(
        body.originalSessionId,
      );

    return {
      status: 'success',
      data: {
        message: restoredSession
          ? `Restored archived session ${body.originalSessionId}`
          : `Archive not found for session ${body.originalSessionId}`,
        restoredSession,
      },
    };
  }

  /**
   * Trigger manual archive cleanup
   * POST /sessions/archives/cleanup
   */
  @Post('archives/cleanup')
  @HttpCode(HttpStatus.OK)
  async triggerArchiveCleanup(
    @Body()
    body: {
      maxTerminatedDays?: number;
      batchSize?: number;
      dryRun?: boolean;
    } = {},
  ) {
    const result =
      await this.sessionArchiveService.archiveTerminatedSessions(body);

    return {
      status: 'success',
      data: {
        message: body.dryRun
          ? 'Archive cleanup simulation completed'
          : 'Archive cleanup completed',
        result: {
          archivedCount: result.archivedCount,
          skippedCount: result.skippedCount,
          dryRun: result.dryRun,
        },
      },
    };
  }

  /**
   * Clean up expired archives
   * POST /sessions/archives/cleanup-expired
   */
  @Post('archives/cleanup-expired')
  @HttpCode(HttpStatus.OK)
  async cleanupExpiredArchives(
    @Body()
    body: {
      dryRun?: boolean;
      batchSize?: number;
    } = {},
  ) {
    const result =
      await this.sessionArchiveService.cleanupExpiredArchives(body);

    return {
      status: 'success',
      data: {
        message: body.dryRun
          ? 'Expired archive cleanup simulation completed'
          : 'Expired archive cleanup completed',
        result: {
          deletedCount: result.deletedCount,
          dryRun: result.dryRun,
        },
      },
    };
  }
}
