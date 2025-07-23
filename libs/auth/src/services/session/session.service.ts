import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from '@app/auth/dto/session.dto';
import { SessionRepository } from '@app/db';

@Injectable()
export class SessionService {
  constructor(private readonly sessionRepo: SessionRepository) {}

  async createSession(dto: CreateSessionDto) {
    return this.sessionRepo.createSession(dto);
  }
}
