import { Injectable } from '@nestjs/common';
import { SecurityEventEntity, SecurityEventRepository } from '@app/db';
import { CreateSecurityEventDto } from '@app/security/dto/security-event.dto';
import { CommonService } from '@app/shared-utils';

@Injectable()
export class SecurityEventService {
  constructor(
    private readonly securityEventRepository: SecurityEventRepository,
  ) {}

  async createSecurityEvent(dto: CreateSecurityEventDto) {
    const createSecurityEventDto: Partial<SecurityEventEntity> = {
      user: dto.user ?? null,
      eventType: dto.eventType,
      eventCategory: dto.eventCategory,
      severity: dto.severity,
      occurredAt: new Date(),
      userAgent: CommonService.getRequesterUserAgent(dto.req),
      ipAddress: CommonService.getRequesterIpAddress(dto.req),
      sessionId: String(dto.session?.id),
    };

    return this.securityEventRepository.createSecurityEvent(
      createSecurityEventDto,
    );
  }
}
