import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SessionArchiveEntity, SessionEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SessionArchiveService } from './session-archive.service';
import { SessionCleanupService } from './session-cleanup.service';
import { SessionService } from './session.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([SessionEntity, SessionArchiveEntity]),
    ScheduleModule.forRoot(),
  ],
  providers: [SessionService, SessionCleanupService, SessionArchiveService],
  exports: [SessionService, SessionCleanupService, SessionArchiveService],
})
export class SessionModule {}
