import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from '@app/auth/dto/session.dto';
import {
  DeviceEntity,
  SessionEntity,
  SessionRepository,
  UserEntity,
} from '@app/db';
import { CommonService } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly commonService: CommonService,
  ) {}

  async createSession(
    user: UserEntity,
    device: DeviceEntity,
    req: FastifyRequest,
  ) {
    const createSessionDto: Partial<SessionEntity> = {
      user: user,
      device: device,
      ipAddress: CommonService.getRequesterIpAddress(req),
      userAgent: CommonService.getRequesterUserAgent(req),
      lastActivityAt: new Date(),
    };
    return this.sessionRepo.createSession(createSessionDto);
  }

  async updateSession(id: number, session: Partial<SessionEntity>) {
    return this.sessionRepo.updateSession(id, session);
  }
}
