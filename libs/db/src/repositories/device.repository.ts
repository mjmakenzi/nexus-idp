import { EntityRepository } from '@mikro-orm/postgresql';
import { DeviceEntity } from '../entities/device.entity';

export class DeviceRepository extends EntityRepository<DeviceEntity> {}
