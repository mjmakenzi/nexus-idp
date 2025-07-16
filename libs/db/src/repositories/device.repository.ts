import { EntityRepository } from '@mikro-orm/postgresql';
// import { UserEntity } from '../../../user/src/entities/user.entity';
import { DeviceEntity } from '../entities/device.entity';

export class DeviceRepository extends EntityRepository<DeviceEntity> {
  // async findDevice(user: UserEntity, refreshToken: string) {
  //   return this.findOne({
  //     user: user,
  //     refreshToken: refreshToken,
  //     terminatedOn: null,
  //   });
  // }
  // async createDevice(
  //   user: UserEntity,
  //   newToken: string,
  //   deviceType: string,
  //   deviceInfo: string,
  //   deviceId: string,
  //   userAgent: string,
  //   ip: string,
  //   expiredOn: Date,
  // ) {
  //   return this.create({
  //     user: user,
  //     deviceId: deviceId,
  //     deviceName: null,
  //     deviceType: deviceType,
  //     deviceInfo: deviceInfo,
  //     refreshToken: newToken,
  //     userAgent: userAgent,
  //     ip: ip,
  //     lastActivity: new Date(),
  //     createdOn: new Date(),
  //     expiredOn: expiredOn,
  //     terminatedOn: null,
  //   });
  // }
}
