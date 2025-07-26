import { Injectable } from '@nestjs/common';
import { DeviceEntity, DeviceRepository, UserEntity } from '@app/db';
import { CommonService } from '@app/shared-utils';
import { randomUUID } from 'crypto';
import { FastifyRequest } from 'fastify';

@Injectable()
export class DevicesService {
  constructor(private readonly deviceRepo: DeviceRepository) {}

  async createDevice(user: UserEntity, req: FastifyRequest) {
    const device = await this.deviceRepo.findByFingerprint(
      CommonService.getRequesterDeviceFingerprint(req),
    );
    if (device) {
      return device;
    }

    const createDeviceDto: Partial<DeviceEntity> = {
      user: user,
      deviceFingerprint:
        CommonService.getRequesterDeviceFingerprint(req) || randomUUID(),
      userAgent: CommonService.getRequesterUserAgent(req),
      lastIpAddress: CommonService.getRequesterIpAddress(req),
      deviceType: CommonService.getRequesterDeviceType(req),
      osName: CommonService.getRequesterOsName(req),
      osVersion: CommonService.getRequesterOsVersion(req),
      browserName: CommonService.getRequesterBrowserName(req),
      browserVersion: CommonService.getRequesterBrowserVersion(req),
      lastSeenAt: new Date(),
    };
    return this.deviceRepo.createDevice(createDeviceDto);
  }
}
