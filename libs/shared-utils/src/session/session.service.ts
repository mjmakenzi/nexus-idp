import { Injectable } from '@nestjs/common';
import {
  DeviceEntity,
  SessionEntity,
  SessionRepository,
  SessionTerminationReason,
  UserEntity,
} from '@app/db';
import { CommonService } from '@app/shared-utils';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepo: SessionRepository) {}

  /**
   * Check if user has reached maximum allowed active sessions
   * @param userId - User ID to check
   * @param maxSessions - Maximum allowed sessions (default: 5)
   * @returns true if user has reached limit, false otherwise
   */
  async hasReachedSessionLimit(
    userId: number,
    maxSessions: number = 5,
  ): Promise<boolean> {
    const activeSessions = await this.sessionRepo.findActiveByUser(userId);
    return activeSessions.length >= maxSessions;
  }

  /**
   * Get count of active sessions for a user
   * @param userId - User ID to check
   * @returns number of active sessions
   */
  async getActiveSessionCount(userId: number): Promise<number> {
    const activeSessions = await this.sessionRepo.findActiveByUser(userId);
    return activeSessions.length;
  }

  /**
   * Terminate oldest sessions if user has reached limit
   * @param userId - User ID
   * @param maxSessions - Maximum allowed sessions
   * @returns number of sessions terminated
   */
  async enforceSessionLimit(
    userId: number,
    maxSessions: number = 5,
  ): Promise<number> {
    const activeSessions = await this.sessionRepo.findActiveByUser(userId);

    if (activeSessions.length < maxSessions) {
      return 0;
    }

    // Sort by last activity and terminate oldest sessions
    const sessionsToTerminate = activeSessions
      .sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime())
      .slice(0, activeSessions.length - maxSessions + 1);

    let terminatedCount = 0;
    for (const session of sessionsToTerminate) {
      session.terminatedAt = new Date();
      session.terminationReason =
        SessionTerminationReason.SESSION_LIMIT_ENFORCED;
      await this.sessionRepo.updateSession(session.id, session);
      terminatedCount++;
    }

    return terminatedCount;
  }

  /**
   * Check if session exists for same device and user
   * @param userId - User ID
   * @param deviceId - Device ID
   * @returns existing session if found, null otherwise
   */
  async findExistingSessionForDevice(
    userId: number,
    deviceId: number,
  ): Promise<SessionEntity | null> {
    const activeSessions = await this.sessionRepo.findActiveByUser(userId);
    return (
      activeSessions.find((session) => session.device?.id === deviceId) || null
    );
  }

  async createSession(
    user: UserEntity,
    device: DeviceEntity,
    req: FastifyRequest,
  ) {
    const createSessionDto: Partial<SessionEntity> = {
      user: user,
      device: device,
      sessionId: randomUUID(),
      ipAddress: CommonService.getRequesterIpAddress(req),
      userAgent: CommonService.getRequesterUserAgent(req),
      lastActivityAt: new Date(),
    };
    return this.sessionRepo.createSession(createSessionDto);
  }

  async updateBySessionId(session: SessionEntity) {
    return this.sessionRepo.updateBySessionId(session.sessionId, session);
  }

  async findSessionWithUser(sessionId: string, userId: number) {
    return this.sessionRepo.findSessionWithUser(sessionId, userId);
  }
}
