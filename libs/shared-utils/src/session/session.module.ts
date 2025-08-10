import { Module } from '@nestjs/common';
import { SessionEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SessionService } from './session.service';

@Module({
  imports: [MikroOrmModule.forFeature([SessionEntity])],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
