import { Injectable } from '@nestjs/common';
import { CreateRateLimitDto, FindRateLimitDto } from './dto/rate-limit.dto';
import { CreateSecurityEventDto } from './dto/security-event.dto';
import { RateLimitService } from './services/rate-limit/rate-limit.service';
import { SecurityEventService } from './services/security-event/security-event.service';

@Injectable()
export class SecurityService {
  constructor(
    private readonly securityEventService: SecurityEventService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async createSecurityEvent(dto: CreateSecurityEventDto) {
    return this.securityEventService.createSecurityEvent(dto);
  }

  async createRateLimit(dto: CreateRateLimitDto) {
    return this.rateLimitService.createRateLimit(dto);
  }

  async findRateLimit(dto: FindRateLimitDto) {
    return this.rateLimitService.findRateLimit(dto);
  }

  async updateRateLimit(id: bigint, updateData: Partial<any>) {
    return this.rateLimitService.updateRateLimit(id, updateData);
  }
}
