import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AvatarModule } from '../avatar/avatar.module';
import { DiscourseService } from './discourse.service';

@Module({
  imports: [ConfigModule, AvatarModule],
  providers: [DiscourseService],
  exports: [DiscourseService],
})
export class DiscourseModule {}
