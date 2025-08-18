import { EntityRepository } from '@mikro-orm/postgresql';
import {
  SessionEntity,
  SessionTerminationReason,
} from '../entities/session.entity';

export class SessionRepository extends EntityRepository<SessionEntity> {
  /**
   * Create and persist a new session
   */
  async createSession(dto: Partial<SessionEntity>): Promise<SessionEntity> {
    const sessionEntity = await this.create(dto as SessionEntity);

    await this.em.persistAndFlush(sessionEntity);
    return sessionEntity;
  }

  /**
   * Update a session
   */
  async updateSession(
    id: bigint,
    dto: Partial<SessionEntity>,
  ): Promise<SessionEntity> {
    const session = await this.findOne({ id });
    if (!session) {
      throw new Error('Session not found');
    }
    Object.assign(session, dto);
    await this.em.flush();
    return session;
  }

  async updateBySessionId(
    sessionId: string,
    dto: Partial<SessionEntity>,
  ): Promise<SessionEntity> {
    const session = await this.findOne({ sessionId: sessionId });
    if (!session) {
      throw new Error('Session not found');
    }
    Object.assign(session, dto);
    await this.em.flush();
    return session;
  }

  /**
   * Find a session by its primary key
   */
  async findById(id: number): Promise<SessionEntity | null> {
    return this.findOne({ id });
  }

  /**
   * List all active (not terminated, not expired) sessions for a user
   */
  async findActiveByUser(userId: number): Promise<SessionEntity[]> {
    return this.find({
      user: userId,
      terminatedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Find a session by its refresh token hash
   */
  async findByRefreshTokenHash(hash: string): Promise<SessionEntity | null> {
    return this.findOne({ refreshTokenHash: hash, terminatedAt: null });
  }

  /**
   * Mark a session as terminated (logout)
   */
  async terminateSession(sessionId: number, reason?: string): Promise<void> {
    const session = await this.findOne({ id: sessionId });
    if (session) {
      session.terminatedAt = new Date();
      // session.terminationReason = reason; // Uncomment if you add this field
      await this.em.flush();
    }
  }

  /**
   * Log out user from all devices except the current session
   */
  async terminateAllExcept(
    userId: number,
    exceptSessionId: number,
  ): Promise<void> {
    await this.nativeUpdate(
      { user: userId, id: { $ne: exceptSessionId }, terminatedAt: null },
      { terminatedAt: new Date() },
    );
  }

  /**
   * Update the last activity timestamp for a session
   */
  async updateLastActivity(sessionId: number): Promise<void> {
    await this.nativeUpdate({ id: sessionId }, { lastActivityAt: new Date() });
  }

  /**
   * Delete expired or terminated sessions
   * Returns the number of deleted sessions
   */
  async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.nativeDelete({
      $or: [{ expiresAt: { $lte: now } }, { terminatedAt: { $ne: null } }],
    });
    return result;
  }

  /**
   * List all sessions for a specific device
   */
  async findByDevice(deviceId: number): Promise<SessionEntity[]> {
    return this.find({ device: deviceId });
  }

  /**
   * Find a session and user data related to it
   * This is used to get the user data for the session
   * and to populate the user data in the session
   */
  async findSessionWithUser(
    sessionId: string,
    userId: number,
  ): Promise<SessionEntity | null> {
    const session = await this.findOne(
      {
        sessionId: sessionId,
        user: userId,
        terminatedAt: null,
        terminationReason: null,
      },
      { populate: ['user.profile'] },
    );
    if (!session) return null;

    return session;
  }

  /**
   * Find a session with selected user and profile fields
   * Returns a DTO with only the specified fields
   */
  async findSessionWithSelectedUserFields(
    sessionId: string,
    userId: number,
  ): Promise<{
    id: bigint;
    refreshTokenHash?: string;
    expiresAt: Date;
    lastActivityAt?: Date;
    terminatedAt?: Date;
    terminationReason?: string;
    user: {
      id: bigint;
      username: string;
      email?: string;
      emailVerifiedAt?: Date;
      phoneVerifiedAt?: Date;
      status: string;
      createdAt?: Date;
      profile?: {
        displayname?: string;
      };
    };
  } | null> {
    const session = await this.findOne(
      {
        sessionId: sessionId,
        user: userId,
        terminatedAt: null,
        terminationReason: null,
      },
      { populate: ['user.profile'] },
    );

    if (!session || !session.user) return null;

    return {
      id: session.id,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
      user: {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
        emailVerifiedAt: session.user.emailVerifiedAt,
        phoneVerifiedAt: session.user.phoneVerifiedAt,
        status: session.user.status,
        createdAt: session.user.createdAt,
        profile: session.user.profile
          ? {
              displayname: session.user.profile.displayname,
            }
          : undefined,
      },
    };
  }

  /**
   * Find terminated sessions older than a specific date
   * Used for archiving old terminated sessions
   */
  async findTerminatedSessionsOlderThan(
    cutoffDate: Date,
  ): Promise<SessionEntity[]> {
    return this.find({
      terminatedAt: { $lt: cutoffDate },
    });
  }

  /**
   * Delete a session by ID
   * Used for removing sessions after archiving
   */
  async deleteSessionById(id: bigint): Promise<void> {
    const session = await this.findOne({ id });
    if (session) {
      await this.em.removeAndFlush(session);
    }
  }

  /**
   * Create a new session from archive data
   * Used for restoring archived sessions
   */
  async createSessionFromArchive(
    sessionData: Partial<SessionEntity>,
  ): Promise<SessionEntity> {
    const sessionEntity = await this.create(sessionData as SessionEntity);
    await this.em.persistAndFlush(sessionEntity);
    return sessionEntity;
  }

  /**
   * Find expired sessions that need cleanup
   * @param expiredThreshold - Date threshold for expired sessions
   * @returns array of expired sessions
   */
  async findExpiredSessionsForCleanup(
    expiredThreshold: Date,
  ): Promise<SessionEntity[]> {
    return this.find({
      terminatedAt: null,
      expiresAt: { $lt: expiredThreshold },
    });
  }

  /**
   * Find inactive sessions that need cleanup
   * @param inactiveThreshold - Date threshold for inactive sessions
   * @param now - Current date
   * @returns array of inactive sessions
   */
  async findInactiveSessionsForCleanup(
    inactiveThreshold: Date,
    now: Date,
  ): Promise<SessionEntity[]> {
    return this.find({
      terminatedAt: null,
      lastActivityAt: { $lt: inactiveThreshold },
      expiresAt: { $gt: now }, // Still not expired
    });
  }

  /**
   * Terminate multiple sessions with a specific reason
   * @param sessions - Array of sessions to terminate
   * @param reason - Termination reason
   * @returns number of sessions terminated
   */
  async terminateSessions(
    sessions: SessionEntity[],
    reason: SessionTerminationReason,
  ): Promise<number> {
    let terminatedCount = 0;
    const now = new Date();

    for (const session of sessions) {
      session.terminatedAt = now;
      session.terminationReason = reason;
      await this.updateSession(session.id, session);
      terminatedCount++;
    }

    return terminatedCount;
  }

  /**
   * Get session health statistics
   * @returns session health metrics
   */
  async getSessionHealthStats(): Promise<{
    totalActiveSessions: number;
    totalExpiredSessions: number;
    totalTerminatedSessions: number;
    orphanedSessions: number;
    sessionsByUser: { userId: number; sessionCount: number }[];
    sessionsByDevice: { deviceId: number; sessionCount: number }[];
  }> {
    const now = new Date();
    const inactiveThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days

    // Get all sessions
    const allSessions = await this.findAll();

    // Calculate statistics
    const totalActiveSessions = allSessions.filter(
      (session) => !session.terminatedAt && session.expiresAt > now,
    ).length;

    const totalExpiredSessions = allSessions.filter(
      (session) => !session.terminatedAt && session.expiresAt <= now,
    ).length;

    const totalTerminatedSessions = allSessions.filter(
      (session) => session.terminatedAt !== null,
    ).length;

    const orphanedSessions = allSessions.filter(
      (session) =>
        !session.terminatedAt &&
        session.expiresAt > now &&
        session.lastActivityAt < inactiveThreshold,
    ).length;

    // Sessions by user
    const sessionsByUser = allSessions
      .filter((session) => !session.terminatedAt && session.expiresAt > now)
      .reduce(
        (acc, session) => {
          const userId = Number(session.user.id);
          acc[userId] = (acc[userId] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

    const sessionsByUserArray = Object.entries(sessionsByUser).map(
      ([userId, count]) => ({
        userId: Number(userId),
        sessionCount: count,
      }),
    );

    // Sessions by device
    const sessionsByDevice = allSessions
      .filter(
        (session) =>
          !session.terminatedAt && session.expiresAt > now && session.device,
      )
      .reduce(
        (acc, session) => {
          const deviceId = Number(session.device!.id);
          acc[deviceId] = (acc[deviceId] || 0) + 1;
          return acc;
        },
        {} as Record<number, number>,
      );

    const sessionsByDeviceArray = Object.entries(sessionsByDevice).map(
      ([deviceId, count]) => ({
        deviceId: Number(deviceId),
        sessionCount: count,
      }),
    );

    return {
      totalActiveSessions,
      totalExpiredSessions,
      totalTerminatedSessions,
      orphanedSessions,
      sessionsByUser: sessionsByUserArray,
      sessionsByDevice: sessionsByDeviceArray,
    };
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
    const activeSessions = await this.findActiveByUser(userId);
    return await this.terminateSessions(activeSessions, reason);
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
    const deviceSessions = await this.findByDevice(deviceId);
    const activeSessions = deviceSessions.filter(
      (session) => !session.terminatedAt && session.expiresAt > new Date(),
    );
    return await this.terminateSessions(activeSessions, reason);
  }
}
