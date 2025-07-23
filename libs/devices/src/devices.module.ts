import { Module } from '@nestjs/common';
import { DeviceEntity } from '@app/db';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DevicesService } from './devices.service';

@Module({
  imports: [MikroOrmModule.forFeature([DeviceEntity])],
  providers: [DevicesService],
  exports: [DevicesService],
})
export class DevicesModule {}
