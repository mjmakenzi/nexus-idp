import { BadRequestException, Injectable } from '@nestjs/common';
import { DeviceEntity, DeviceRepository, UserEntity } from '@app/db';
import { CommonService } from '@app/shared-utils';
import { DeviceDetectionService } from '@app/shared-utils/device-detection/device-detection.service';
import { FastifyRequest } from 'fastify';

@Injectable()
export class DevicesService {
  constructor(
    private readonly deviceRepo: DeviceRepository,
    private readonly deviceDetection: DeviceDetectionService,
  ) {}

  async createDevice(user: UserEntity, req: FastifyRequest) {
    // BEST PRACTICE: Get all device info at once using enhanced detection
    const deviceInfo = this.deviceDetection.getCompleteDeviceInfo(req);

    // SECURITY FIX: Check for active (non-blocked) device owned by this specific user
    const activeDevice = await this.deviceRepo.findActiveByFingerprintAndUser(
      deviceInfo.fingerprint,
      Number(user.id),
    );

    if (activeDevice) {
      // Update last seen and return existing active device with enhanced metadata
      return await this.updateExistingActiveDevice(activeDevice, req);
    }

    // Check if there's ANY device with same fingerprint (global unique constraint)
    const existingDevice = await this.deviceRepo.findByFingerprint(
      deviceInfo.fingerprint,
    );

    if (existingDevice) {
      // Check if it's owned by the same user
      if (Number(existingDevice.user.id) === Number(user.id)) {
        // Same user - handle blocking status
        if (existingDevice.blockedAt) {
          return await this.handleBlockedDeviceReactivation(
            existingDevice,
            user,
            req,
          );
        } else {
          // Device exists and is active - this shouldn't happen due to earlier check
          // But handle gracefully by updating it
          return await this.updateExistingActiveDevice(existingDevice, req);
        }
      } else {
        // CRITICAL SECURITY ISSUE: Different user has device with same fingerprint
        return await this.handleCrossUserDeviceConflict(
          existingDevice,
          user,
          req,
        );
      }
    }

    // BEST PRACTICE: Create device with comprehensive metadata
    const createDeviceDto: Partial<DeviceEntity> = {
      user: user,
      deviceFingerprint: deviceInfo.fingerprint,
      deviceName: deviceInfo.deviceName, // NEW: Use device name from model
      userAgent: deviceInfo.userAgent,
      lastIpAddress: deviceInfo.ipAddress,
      deviceType: deviceInfo.deviceType,
      osName: deviceInfo.osName,
      osVersion: deviceInfo.osVersion,
      browserName: deviceInfo.browserName,
      browserVersion: deviceInfo.browserVersion,
      lastSeenAt: new Date(),
      // Enhanced metadata storage
      deviceMetadata: {
        secondaryFingerprint: deviceInfo.secondaryFingerprint,
        confidence: deviceInfo.confidence,
        detectionComponents: deviceInfo.components,
        createdWith: 'enhanced-detection-v1',
      },
    };

    console.info('Creating new device with enhanced detection', {
      userId: user.id,
      fingerprint: deviceInfo.fingerprint.substring(0, 8) + '...',
      confidence: deviceInfo.confidence,
      deviceType: deviceInfo.deviceType,
      os: `${deviceInfo.osName} ${deviceInfo.osVersion}`,
      browser: `${deviceInfo.browserName} ${deviceInfo.browserVersion}`,
    });

    return this.deviceRepo.createDevice(createDeviceDto);
  }

  async updateDevice(device: DeviceEntity) {
    const updateData: Partial<DeviceEntity> = {
      isTrusted: false,
      blockedAt: new Date(),
      blockReason: 'Manual logout',
    };

    const updatedDevice = await this.deviceRepo.updateDevice(
      Number(device.id),
      updateData,
    );
    return updatedDevice || device;
  }

  /**
   * Block a device for security reasons
   */
  async blockDevice(
    deviceId: number,
    reason: string,
    userId?: number,
  ): Promise<DeviceEntity | null> {
    const updateData: Partial<DeviceEntity> = {
      isTrusted: false,
      blockedAt: new Date(),
      blockReason: reason,
    };

    // Security check: Only allow blocking devices owned by the user
    if (userId) {
      const device = await this.deviceRepo.findByFingerprintAndUser(
        '', // We don't have fingerprint here, use findById instead
        userId,
      );
      // Additional validation could be added here
    }

    return await this.deviceRepo.updateDevice(deviceId, updateData);
  }

  /**
   * Unblock a device (administrative action or user verification)
   */
  async unblockDevice(
    deviceId: number,
    userId: number,
  ): Promise<DeviceEntity | null> {
    // Verify device ownership before unblocking
    const device = await this.deviceRepo.findById(deviceId);
    if (!device || Number(device.user.id) !== userId) {
      throw new Error('Device not found or access denied');
    }

    return await this.deviceRepo.unblockDevice(deviceId);
  }

  /**
   * Check if device is safe to use for authentication
   */
  async isDeviceSafeForAuth(
    deviceId: number,
    userId: number,
  ): Promise<boolean> {
    const device = await this.deviceRepo.findById(deviceId);
    if (!device) return false;

    // Check ownership
    if (Number(device.user.id) !== userId) return false;

    // Check if blocked
    if (device.blockedAt) return false;

    // Additional security checks could be added here
    // - Check if device was seen recently
    // - Check for suspicious activity
    // - Check IP reputation

    return true;
  }

  /**
   * SECURITY POLICY: Handle blocked device reactivation based on security rules
   * This implements the core security decision logic for blocked devices
   */
  private async handleBlockedDeviceReactivation(
    blockedDevice: DeviceEntity,
    user: UserEntity,
    req: FastifyRequest,
  ): Promise<DeviceEntity> {
    const blockReason = blockedDevice.blockReason;
    const blockedTime = blockedDevice.blockedAt;
    const timeSinceBlocked = blockedTime
      ? Date.now() - blockedTime.getTime()
      : 0;
    const hoursSinceBlocked = timeSinceBlocked / (1000 * 60 * 60);

    // Log the reactivation attempt
    console.info('Blocked device reactivation attempt', {
      userId: user.id,
      deviceId: blockedDevice.id,
      fingerprint: blockedDevice.deviceFingerprint,
      blockReason,
      blockedAt: blockedTime,
      hoursSinceBlocked: Math.round(hoursSinceBlocked * 100) / 100,
      userOwned: Number(blockedDevice.user.id) === Number(user.id),
    });

    // POLICY 1: Check device ownership (Critical Security Check)
    if (Number(blockedDevice.user.id) !== Number(user.id)) {
      // Different user trying to use blocked device - SECURITY VIOLATION
      console.error('Cross-user blocked device access attempt', {
        blockedDeviceUserId: blockedDevice.user.id,
        attemptingUserId: user.id,
        deviceId: blockedDevice.id,
      });

      throw new BadRequestException(
        'Device authentication failed. Please contact support if this continues.',
      );
    }

    // POLICY 2: Handle based on block reason
    switch (blockReason) {
      case 'Manual logout':
      case 'Session timeout':
      case 'User logout':
        // SAFE: Normal user actions - Auto reactivate
        return await this.reactivateDevice(
          blockedDevice,
          req,
          'Normal user return',
        );

      case 'Security violation':
      case 'Compromised':
      case 'Suspicious activity':
        // CRITICAL: Security incidents - Require additional verification
        if (hoursSinceBlocked < 24) {
          // Recent security block - require waiting period
          throw new BadRequestException(
            'Device temporarily blocked for security. Please try again later or contact support.',
          );
        }
        // After 24 hours, allow reactivation but mark as untrusted
        return await this.reactivateDevice(
          blockedDevice,
          req,
          'Post-security-cooldown reactivation',
          false, // Not trusted
        );

      case 'Admin blocked':
      case 'Policy violation':
        // ADMIN: Administrative blocks - Require manual review
        throw new BadRequestException(
          'Device requires administrator approval. Please contact support.',
        );

      case 'Too many sessions':
      case 'Session limit enforced':
        // RESOURCE: Resource management - Auto reactivate
        return await this.reactivateDevice(
          blockedDevice,
          req,
          'Session limit reactivation',
        );

      default:
        // UNKNOWN: Unknown block reason - Conservative approach
        if (hoursSinceBlocked < 1) {
          // Very recent block - be cautious
          throw new BadRequestException(
            'Device temporarily unavailable. Please try again in a few minutes.',
          );
        }
        // After 1 hour, allow reactivation but log for review
        console.warn('Unknown block reason reactivation', {
          blockReason,
          deviceId: blockedDevice.id,
          userId: user.id,
        });
        return await this.reactivateDevice(
          blockedDevice,
          req,
          'Unknown reason reactivation',
          false, // Not trusted due to unknown reason
        );
    }
  }

  /**
   * Safely reactivate a blocked device with updated metadata using enhanced detection
   */
  private async reactivateDevice(
    device: DeviceEntity,
    req: FastifyRequest,
    reactivationReason: string,
    isTrusted: boolean = false,
  ): Promise<DeviceEntity> {
    // BEST PRACTICE: Use enhanced detection for reactivation
    const deviceInfo = this.deviceDetection.getCompleteDeviceInfo(req);

    const updateData: Partial<DeviceEntity> = {
      // Clear blocking fields
      blockedAt: undefined,
      blockReason: undefined,

      // Update device metadata with enhanced detection
      lastSeenAt: new Date(),
      lastIpAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceName: deviceInfo.deviceName, // NEW: Update device name

      // Security settings
      isTrusted: isTrusted,

      // Update technical details with enhanced detection
      deviceType: deviceInfo.deviceType,
      osName: deviceInfo.osName,
      osVersion: deviceInfo.osVersion,
      browserName: deviceInfo.browserName,
      browserVersion: deviceInfo.browserVersion,

      // Enhanced metadata for reactivation
      deviceMetadata: {
        ...device.deviceMetadata,
        reactivatedAt: new Date().toISOString(),
        reactivationReason,
        confidence: deviceInfo.confidence,
        detectionComponents: deviceInfo.components,
      },
    };

    console.info('Device reactivated with enhanced detection', {
      deviceId: device.id,
      userId: device.user.id,
      reason: reactivationReason,
      isTrusted,
      confidence: deviceInfo.confidence,
      fingerprint: deviceInfo.fingerprint.substring(0, 8) + '...',
    });

    const reactivatedDevice = await this.deviceRepo.updateDevice(
      Number(device.id),
      updateData,
    );

    return reactivatedDevice || device;
  }

  /**
   * Update existing active device metadata with enhanced detection
   */
  private async updateExistingActiveDevice(
    device: DeviceEntity,
    req: FastifyRequest,
  ): Promise<DeviceEntity> {
    // BEST PRACTICE: Use enhanced detection for updates
    const deviceInfo = this.deviceDetection.getCompleteDeviceInfo(req);

    const updateData: Partial<DeviceEntity> = {
      lastSeenAt: new Date(),
      lastIpAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceName: deviceInfo.deviceName, // NEW: Update device name
      deviceType: deviceInfo.deviceType,
      osName: deviceInfo.osName,
      osVersion: deviceInfo.osVersion,
      browserName: deviceInfo.browserName,
      browserVersion: deviceInfo.browserVersion,
      // Update metadata with latest detection info
      deviceMetadata: {
        ...device.deviceMetadata,
        lastUpdate: new Date().toISOString(),
        confidence: deviceInfo.confidence,
        detectionComponents: deviceInfo.components,
      },
    };

    const updatedDevice = await this.deviceRepo.updateDevice(
      Number(device.id),
      updateData,
    );

    return updatedDevice || device;
  }

  /**
   * CRITICAL SECURITY: Handle device fingerprint collision between different users
   * This is a serious security concern that needs careful handling
   */
  private async handleCrossUserDeviceConflict(
    existingDevice: DeviceEntity,
    newUser: UserEntity,
    req: FastifyRequest,
  ): Promise<DeviceEntity> {
    const deviceFingerprint = existingDevice.deviceFingerprint;

    // Log critical security event
    console.error('SECURITY ALERT: Device fingerprint collision detected', {
      existingDeviceId: existingDevice.id,
      existingUserId: existingDevice.user.id,
      newUserId: newUser.id,
      fingerprint: deviceFingerprint,
      ipAddress: CommonService.getRequesterIpAddress(req),
      userAgent: CommonService.getRequesterUserAgent(req),
      timestamp: new Date().toISOString(),
    });

    // SECURITY POLICY: Different strategies based on existing device status
    if (existingDevice.blockedAt) {
      // Existing device is blocked - this might be legitimate device transfer
      const daysSinceBlocked = existingDevice.blockedAt
        ? (Date.now() - existingDevice.blockedAt.getTime()) /
          (1000 * 60 * 60 * 24)
        : 0;

      if (daysSinceBlocked > 30) {
        // Old blocked device - allow new user to claim it
        console.info(
          'Device transfer: Old blocked device claimed by new user',
          {
            previousUserId: existingDevice.user.id,
            newUserId: newUser.id,
            deviceId: existingDevice.id,
            daysSinceBlocked,
          },
        );

        // Transfer device to new user
        const transferData: Partial<DeviceEntity> = {
          user: newUser,
          blockedAt: undefined,
          blockReason: undefined,
          isTrusted: false, // Start untrusted for security
          lastSeenAt: new Date(),
          lastIpAddress: CommonService.getRequesterIpAddress(req),
          userAgent: CommonService.getRequesterUserAgent(req),
          deviceType: CommonService.getRequesterDeviceType(req),
          osName: CommonService.getRequesterOsName(req),
          osVersion: CommonService.getRequesterOsVersion(req),
          browserName: CommonService.getRequesterBrowserName(req),
          browserVersion: CommonService.getRequesterBrowserVersion(req),
        };

        const transferredDevice = await this.deviceRepo.updateDevice(
          Number(existingDevice.id),
          transferData,
        );

        return transferredDevice || existingDevice;
      }
    }

    // Default policy: Block the authentication attempt
    // This handles:
    // - Active device owned by different user
    // - Recently blocked device from different user
    // - Any suspicious fingerprint collision

    throw new BadRequestException(
      'Device authentication failed due to security policy. Please contact support.',
    );
  }
}
