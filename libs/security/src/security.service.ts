import { Injectable } from '@nestjs/common';
import { SessionEntity, UserEntity } from '@app/db';
import { FastifyRequest } from 'fastify';
import { CreateRateLimitDto, FindRateLimitDto } from './dto/rate-limit.dto';
import { RateLimitService } from './services/rate-limit/rate-limit.service';
import { SecurityEventService } from './services/security-event/security-event.service';

@Injectable()
export class SecurityService {
  constructor(
    private readonly securityEventService: SecurityEventService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async createSecurityEvent(
    user: UserEntity,
    req: FastifyRequest,
    session: SessionEntity,
  ) {
    return this.securityEventService.createSecurityEvent(user, req, session);
  }

  async createRateLimit(dto: CreateRateLimitDto) {
    return this.rateLimitService.createRateLimit(dto);
  }

  async findRateLimit(dto: FindRateLimitDto) {
    return this.rateLimitService.findRateLimit(dto);
  }
}
