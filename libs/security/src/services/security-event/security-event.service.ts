import { Injectable } from '@nestjs/common';
import { SecurityEventRepository } from '@app/db';
import { CreateSecurityEventDto } from '../../dto/security-event.dto';

@Injectable()
export class SecurityEventService {
  constructor(
    private readonly securityEventRepository: SecurityEventRepository,
  ) {}

  async createSecurityEvent(dto: CreateSecurityEventDto) {
    return this.securityEventRepository.createSecurityEvent(dto);
  }
}
