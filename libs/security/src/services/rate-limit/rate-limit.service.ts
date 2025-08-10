import { Injectable } from '@nestjs/common';
import { RateLimitEntity } from '@app/db';
import { RateLimitRepository } from '@app/db/repositories/rate-limit.repository';
import { CreateRateLimitDto, FindRateLimitDto } from '../../dto/rate-limit.dto';

@Injectable()
export class RateLimitService {
  constructor(private readonly rateLimitRepository: RateLimitRepository) {}

  async createRateLimit(dto: CreateRateLimitDto) {
    return this.rateLimitRepository.createRateLimit(dto);
  }

  async findRateLimit(dto: FindRateLimitDto) {
    return this.rateLimitRepository.findByIdentifierAndType(
      dto.identifier,
      dto.limitType,
    );
  }

  async updateRateLimit(id: bigint, updateData: Partial<RateLimitEntity>) {
    return this.rateLimitRepository.updateRateLimit(id, updateData);
  }
}
