import { Module } from '@nestjs/common';
import { DeviceDetectionService } from './device-detection.service';

@Module({
  providers: [DeviceDetectionService],
  exports: [DeviceDetectionService],
})
export class DeviceDetectionModule {}
