import { Injectable } from '@nestjs/common';
import {
  DeviceEntity,
  SessionEntity,
  SessionRepository,
  UserEntity,
} from '@app/db';
import { CommonService } from '@app/shared-utils';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepo: SessionRepository) {}

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

  async updateSession(session: SessionEntity) {
    return this.sessionRepo.updateSession(session.id, session);
  }
}
