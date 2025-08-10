import { EntityRepository } from '@mikro-orm/postgresql';
import { DeviceEntity } from '../entities/device.entity';
import { SessionEntity } from '../entities/session.entity';
import { UserEntity } from '../entities/user.entity';

export class DeviceRepository extends EntityRepository<DeviceEntity> {
  /**
   * Find device by ID
   */
  async findById(id: number): Promise<DeviceEntity | null> {
    return this.findOne({ id });
  }

  /**
   * Find device by device fingerprint
   */
  async findByFingerprint(
    deviceFingerprint: string,
  ): Promise<DeviceEntity | null> {
    return this.findOne({ deviceFingerprint });
  }

  /**
   * Find active (non-blocked) device by fingerprint for a specific user
   * This ensures device ownership and prevents blocked device reuse
   */
  async findActiveByFingerprintAndUser(
    deviceFingerprint: string,
    userId: number,
  ): Promise<DeviceEntity | null> {
    return this.findOne({
      deviceFingerprint,
      user: userId,
      blockedAt: null, // Not blocked
    });
  }

  /**
   * Find non-blocked devices for a specific user
   */
  async findActiveByUser(userId: number): Promise<DeviceEntity[]> {
    return this.find({
      user: userId,
      blockedAt: null, // Not blocked
    });
  }

  /**
   * Check if device is blocked
   */
  async isDeviceBlocked(deviceId: number): Promise<boolean> {
    const device = await this.findOne({ id: deviceId });
    return device ? !!device.blockedAt : true; // Treat non-existent as blocked
  }

  /**
   * Unblock a device (for legitimate reactivation)
   */
  async unblockDevice(deviceId: number): Promise<DeviceEntity | null> {
    const device = await this.findOne({ id: deviceId });
    if (!device) return null;

    device.blockedAt = undefined;
    device.blockReason = undefined;
    device.lastSeenAt = new Date();
    await this.em.flush();
    return device;
  }

  /**
   * Find device by fingerprint and user ID
   */
  async findByFingerprintAndUser(
    deviceFingerprint: string,
    userId: number,
  ): Promise<DeviceEntity | null> {
    return this.findOne({ deviceFingerprint, user: userId });
  }

  /**
   * Find all devices for a specific user
   */
  async findByUser(userId: number): Promise<DeviceEntity[]> {
    return this.find({ user: userId });
  }

  /**
   * Find trusted devices for a specific user
   */
  async findTrustedByUser(userId: number): Promise<DeviceEntity[]> {
    return this.find({ user: userId, isTrusted: true });
  }

  // /**
  //  * Find devices by device type (mobile, desktop, tablet)
  //  */
  // async findByDeviceType(deviceType: string): Promise<DeviceEntity[]> {
  //   return this.find({ deviceType: deviceType aeType });
  // }

  /**
   * Find devices by operating system
   */
  async findByOperatingSystem(osName: string): Promise<DeviceEntity[]> {
    return this.find({ osName });
  }

  /**
   * Find devices by browser
   */
  async findByBrowser(browserName: string): Promise<DeviceEntity[]> {
    return this.find({ browserName });
  }

  /**
   * Find devices by IP address
   */
  async findByIpAddress(ipAddress: string): Promise<DeviceEntity[]> {
    return this.find({ lastIpAddress: ipAddress });
  }

  /**
   * Find devices by user agent
   */
  async findByUserAgent(userAgent: string): Promise<DeviceEntity[]> {
    return this.find({ userAgent });
  }

  /**
   * Find devices that were last seen before a specific date (inactive devices)
   */
  async findInactiveDevices(beforeDate: Date): Promise<DeviceEntity[]> {
    return this.find({ lastSeenAt: { $lt: beforeDate } });
  }

  /**
   * Find devices that were last seen after a specific date (recently active)
   */
  async findRecentlyActiveDevices(afterDate: Date): Promise<DeviceEntity[]> {
    return this.find({ lastSeenAt: { $gte: afterDate } });
  }

  /**
   * Create a new device
   */
  async createDevice(dto: Partial<DeviceEntity>): Promise<DeviceEntity> {
    const device = this.create(dto as DeviceEntity);
    await this.em.persistAndFlush(device);
    return device;
  }

  /**
   * Update device information
   */
  async updateDevice(
    id: number,
    deviceData: Partial<DeviceEntity>,
  ): Promise<DeviceEntity | null> {
    const device = await this.findOne({ id });
    if (!device) return null;

    this.assign(device, deviceData);
    await this.em.flush();
    return device;
  }

  /**
   * Update device's last seen timestamp
   */
  async updateLastSeen(deviceId: number): Promise<void> {
    await this.nativeUpdate({ id: deviceId }, { lastSeenAt: new Date() });
  }

  /**
   * Mark device as trusted
   */
  async markAsTrusted(deviceId: number): Promise<void> {
    await this.nativeUpdate({ id: deviceId }, { isTrusted: true });
  }

  /**
   * Mark device as untrusted
   */
  async markAsUntrusted(deviceId: number): Promise<void> {
    await this.nativeUpdate({ id: deviceId }, { isTrusted: false });
  }

  /**
   * Update device's IP address
   */
  async updateIpAddress(deviceId: number, ipAddress: string): Promise<void> {
    await this.nativeUpdate({ id: deviceId }, { lastIpAddress: ipAddress });
  }

  /**
   * Update device's user agent
   */
  async updateUserAgent(deviceId: number, userAgent: string): Promise<void> {
    await this.nativeUpdate({ id: deviceId }, { userAgent: userAgent });
  }

  /**
   * Update device name
   */
  // async updateDeviceName(deviceId: number, deviceName: string): Promise<void> {
  //   await this.nativeUpdate({ id: deviceId }, { deviceName: deviceName });
  // }

  /**
   * Delete device by ID
   */
  async deleteDevice(id: number): Promise<boolean> {
    const device = await this.findOne({ id });
    if (!device) return false;

    await this.em.removeAndFlush(device);
    return true;
  }

  /**
   * Delete all devices for a specific user
   */
  async deleteByUser(userId: number): Promise<number> {
    const result = await this.nativeDelete({ user: userId });
    return result;
  }

  /**
   * Delete inactive devices older than specified date
   */
  async deleteInactiveDevices(beforeDate: Date): Promise<number> {
    const result = await this.nativeDelete({
      lastSeenAt: { $lt: beforeDate },
    });
    return result;
  }

  /**
   * Count devices for a specific user
   */
  async countByUser(userId: number): Promise<number> {
    return this.count({ user: userId });
  }

  /**
   * Count trusted devices for a specific user
   */
  async countTrustedByUser(userId: number): Promise<number> {
    return this.count({ user: userId, isTrusted: true });
  }

  /**
   * Count devices by device type
   */
  // async countByDeviceType(deviceType: string): Promise<number> {
  //   return this.count({ deviceType });
  // }

  /**
   * Count devices by operating system
   */
  async countByOperatingSystem(osName: string): Promise<number> {
    return this.count({ osName });
  }

  /**
   * Count devices by browser
   */
  async countByBrowser(browserName: string): Promise<number> {
    return this.count({ browserName });
  }

  /**
   * Get device statistics for a user
   */
  // async getDeviceStats(userId: number): Promise<{
  //   total: number;
  //   trusted: number;
  //   mobile: number;
  //   desktop: number;
  //   tablet: number;
  //   recentlyActive: number;
  // }> {
  //   const [total, trusted, mobile, desktop, tablet, recentlyActive] =
  //     await Promise.all([
  //       this.countByUser(userId),
  //       this.countTrustedByUser(userId),
  //       this.countByDeviceType('mobile'),
  //       this.countByDeviceType('desktop'),
  //       this.countByDeviceType('tablet'),
  //       this.count({
  //         user: userId,
  //         lastSeenAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
  //       }),
  //     ]);

  //   return {
  //     total,
  //     trusted,
  //     mobile,
  //     desktop,
  //     tablet,
  //     recentlyActive,
  //   };
  // }

  /**
   * Find devices with active sessions
   */
  async findWithActiveSessions(userId: number): Promise<DeviceEntity[]> {
    return this.find(
      { user: userId },
      {
        populate: ['sessions'],
      },
    );
  }

  /**
   * Find duplicate devices (same fingerprint, different users)
   */
  async findDuplicateFingerprints(): Promise<
    Array<{ deviceFingerprint: string; count: number }>
  > {
    const result = await this.em.execute(`
      SELECT device_fingerprint, COUNT(*) as count
      FROM devices
      GROUP BY device_fingerprint
      HAVING COUNT(*) > 1
      ORDER BY count DESC
    `);
    return result as Array<{ deviceFingerprint: string; count: number }>;
  }

  /**
   * Find devices by multiple criteria
   */
  async findByCriteria(criteria: {
    userId?: number;
    deviceType?: string;
    osName?: string;
    browserName?: string;
    isTrusted?: boolean;
    lastSeenAfter?: Date;
    lastSeenBefore?: Date;
  }): Promise<DeviceEntity[]> {
    const where: any = {};

    if (criteria.userId) where.user = criteria.userId;
    if (criteria.deviceType) where.deviceType = criteria.deviceType;
    if (criteria.osName) where.osName = criteria.osName;
    if (criteria.browserName) where.browserName = criteria.browserName;
    if (criteria.isTrusted !== undefined) where.isTrusted = criteria.isTrusted;

    if (criteria.lastSeenAfter || criteria.lastSeenBefore) {
      where.lastSeenAt = {};
      if (criteria.lastSeenAfter)
        where.lastSeenAt.$gte = criteria.lastSeenAfter;
      if (criteria.lastSeenBefore)
        where.lastSeenAt.$lt = criteria.lastSeenBefore;
    }

    return this.find(where);
  }

  /**
   * Bulk update devices
   */
  async bulkUpdate(
    criteria: any,
    updates: Partial<DeviceEntity>,
  ): Promise<number> {
    const result = await this.nativeUpdate(criteria, updates);
    return result;
  }

  /**
   * Get devices with pagination
   */
  async findWithPagination(
    userId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    devices: DeviceEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const [devices, total] = await Promise.all([
      this.find(
        { user: userId },
        { limit, offset, orderBy: { lastSeenAt: 'DESC' } },
      ),
      this.countByUser(userId),
    ]);

    return {
      devices,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findDeviceBySession(sessionId: number): Promise<DeviceEntity | null> {
    return this.findOne({
      sessions: { id: sessionId },
    });
  }
}
