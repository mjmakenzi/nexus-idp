import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppleService } from './apple.service';

@Module({
  imports: [ConfigModule],
  providers: [AppleService],
  exports: [AppleService],
})
export class AppleModule {}
