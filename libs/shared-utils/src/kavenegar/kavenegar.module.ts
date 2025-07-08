import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KavenegarService } from './kavenegar.service';

@Module({
  imports: [ConfigModule],
  providers: [KavenegarService],
  exports: [KavenegarService],
})
export class KavenegarModule {}
