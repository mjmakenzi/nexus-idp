import { Module } from '@nestjs/common';
import { RateLimitEntity, SecurityEventEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityService } from './security.service';
import { RateLimitService } from './services/rate-limit/rate-limit.service';
import { SecurityEventService } from './services/security-event/security-event.service';

@Module({
  imports: [MikroOrmModule.forFeature([SecurityEventEntity, RateLimitEntity])],
  providers: [SecurityService, SecurityEventService, RateLimitService],
  exports: [SecurityService],
})
export class SecurityModule {}
