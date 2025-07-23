import { Injectable } from '@nestjs/common';
import { DeviceRepository } from '@app/db';
import { CreateDeviceDto } from './device.dto';

@Injectable()
export class DevicesService {
  constructor(private readonly deviceRepo: DeviceRepository) {}

  async createDevice(dto: CreateDeviceDto) {
    return this.deviceRepo.createDevice({
      user: dto.user,
      deviceFingerprint: dto.deviceFingerprint,
      deviceType: dto.deviceType,
      deviceName: dto.deviceName,
      osName: dto.osName,
      osVersion: dto.osVersion,
      browserName: dto.browserName,
      browserVersion: dto.browserVersion,
      userAgent: dto.userAgent,
      lastIpAddress: dto.lastIpAddress,
      isTrusted: dto.isTrusted,
    });
  }
}
