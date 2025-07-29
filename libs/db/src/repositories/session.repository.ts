import { EntityRepository } from '@mikro-orm/postgresql';
import { SessionEntity } from '../entities/session.entity';

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
    id: number,
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
    id: number;
    refreshTokenHash?: string;
    expiresAt: Date;
    lastActivityAt?: Date;
    terminatedAt?: Date;
    terminationReason?: string;
    user: {
      id: number;
      username: string;
      email?: string;
      emailVerifiedAt?: Date;
      phoneVerifiedAt?: Date;
      status: string;
      createdAt?: Date;
      profile?: {
        displayname?: string;
        avatarUrl?: string;
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
              avatarUrl: session.user.profile.avatarUrl,
            }
          : undefined,
      },
    };
  }
}
