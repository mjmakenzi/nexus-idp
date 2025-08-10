import { Module } from '@nestjs/common';
import { DeviceEntity } from '@app/db';
import { DeviceDetectionModule } from '@app/shared-utils/device-detection/device-detection.module';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DevicesService } from './devices.service';

@Module({
  imports: [MikroOrmModule.forFeature([DeviceEntity]), DeviceDetectionModule],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
