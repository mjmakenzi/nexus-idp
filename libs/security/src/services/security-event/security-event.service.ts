import { Injectable } from '@nestjs/common';
import {
  SecurityEventEntity,
  SecurityEventRepository,
  SessionEntity,
  UserEntity,
} from '@app/db';
import { CommonService } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

@Injectable()
export class SecurityEventService {
  constructor(
    private readonly securityEventRepository: SecurityEventRepository,
  ) {}

  async createSecurityEvent(
    user: UserEntity,
    req: FastifyRequest,
    session: SessionEntity,
  ) {
    const createSecurityEventDto: Partial<SecurityEventEntity> = {
      user: user,
      eventType: 'login',
      eventCategory: 'auth',
      severity: 'low',
      occurredAt: new Date(),
      userAgent: CommonService.getRequesterUserAgent(req),
      ipAddress: CommonService.getRequesterIpAddress(req),
      sessionId: String(session.id),
    };

    return this.securityEventRepository.createSecurityEvent(
      createSecurityEventDto,
    );
  }
}
