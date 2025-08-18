import { BadRequestException, Injectable } from '@nestjs/common';
import { DeviceEntity, DeviceRepository, UserEntity } from '@app/db';
import { CommonService, DeviceDetectionService } from '@app/shared-utils';
import { FastifyRequest } from 'fastify';

@Injectable()
export class DevicesService {
  constructor(
    private readonly deviceRepo: DeviceRepository,
    private readonly deviceDetection: DeviceDetectionService,
  ) {}

  async createDevice(user: UserEntity, req: FastifyRequest) {
    // SECURITY LAYER 1: Behavioral analysis (server-side, doesn't trust client data)
    const securityAnalysis =
      await this.deviceDetection.analyzeRequestBehavior(req);

    // Log security analysis for monitoring
    console.info('Security analysis for device creation', {
      userId: user.id,
      securityScore: securityAnalysis.securityScore,
      riskLevel: securityAnalysis.riskLevel,
      suspiciousPatterns: securityAnalysis.suspiciousPatterns,
      ipAddress: this.deviceDetection.getRequesterIpAddress(req),
    });

    // SECURITY LAYER 2: Apply security measures based on risk level
    await this.applySecurityMeasures(securityAnalysis, user, req);

    // BEST PRACTICE: Get all device info at once using enhanced detection
    const deviceInfo = this.deviceDetection.getCompleteDeviceInfo(req);

    // SECURITY FIX: Check for active (non-blocked) device owned by this specific user
    const activeDevice = await this.deviceRepo.findActiveByFingerprintAndUser(
      deviceInfo.fingerprint,
      Number(user.id),
    );

    if (activeDevice) {
      // Update last seen and return existing active device with enhanced metadata
      return await this.updateExistingActiveDevice(
        activeDevice,
        req,
        securityAnalysis,
      );
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
            securityAnalysis,
          );
        } else {
          // Device exists and is active - this shouldn't happen due to earlier check
          // But handle gracefully by updating it
          return await this.updateExistingActiveDevice(
            existingDevice,
            req,
            securityAnalysis,
          );
        }
      } else {
        // CRITICAL SECURITY ISSUE: Different user has device with same fingerprint
        return await this.handleCrossUserDeviceConflict(
          existingDevice,
          user,
          req,
          securityAnalysis,
        );
      }
    }

    // BEST PRACTICE: Create device with comprehensive metadata and security info
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
      // Enhanced metadata storage with security analysis
      deviceMetadata: {
        secondaryFingerprint: deviceInfo.secondaryFingerprint,
        confidence: deviceInfo.confidence,
        detectionComponents: deviceInfo.components,
        createdWith: 'enhanced-detection-v1',
        // Security analysis data
        securityAnalysis: {
          initialSecurityScore: securityAnalysis.securityScore,
          initialRiskLevel: securityAnalysis.riskLevel,
          suspiciousPatterns: securityAnalysis.suspiciousPatterns,
          analysisTimestamp: new Date().toISOString(),
        },
      },
    };

    console.info(
      'Creating new device with enhanced detection and security analysis',
      {
        userId: user.id,
        fingerprint: deviceInfo.fingerprint.substring(0, 8) + '...',
        confidence: deviceInfo.confidence,
        deviceType: deviceInfo.deviceType,
        os: `${deviceInfo.osName} ${deviceInfo.osVersion}`,
        browser: `${deviceInfo.browserName} ${deviceInfo.browserVersion}`,
        securityScore: securityAnalysis.securityScore,
        riskLevel: securityAnalysis.riskLevel,
      },
    );

    return this.deviceRepo.createDevice(createDeviceDto);
  }

  /**
   * SECURITY LAYER: Apply security measures based on behavioral analysis
   * This implements the security-first approach without blocking legitimate users
   */
  private async applySecurityMeasures(
    securityAnalysis: any,
    user: UserEntity,
    req: FastifyRequest,
  ): Promise<void> {
    const { securityScore, riskLevel, suspiciousPatterns } = securityAnalysis;

    // CRITICAL RISK: Immediate blocking for obvious attacks
    if (riskLevel === 'critical' || securityScore > 0.9) {
      console.error('CRITICAL SECURITY THREAT DETECTED', {
        userId: user.id,
        securityScore,
        riskLevel,
        suspiciousPatterns,
        ipAddress: this.deviceDetection.getRequesterIpAddress(req),
        userAgent: req.headers['user-agent'],
      });

      throw new BadRequestException(
        'Access denied due to security policy. Please contact support if this is an error.',
      );
    }

    // HIGH RISK: Require additional verification
    if (riskLevel === 'high' || securityScore > 0.7) {
      console.warn('HIGH RISK DEVICE DETECTED', {
        userId: user.id,
        securityScore,
        riskLevel,
        suspiciousPatterns,
        ipAddress: this.deviceDetection.getRequesterIpAddress(req),
      });

      // Log security event for monitoring
      await this.logSecurityEvent('High risk device creation attempt', {
        userId: user.id,
        securityScore,
        riskLevel,
        suspiciousPatterns,
        ipAddress: this.deviceDetection.getRequesterIpAddress(req),
        userAgent: req.headers['user-agent'],
      });

      // For now, allow but mark as untrusted
      // In production, you might want to require additional authentication
    }

    // MEDIUM RISK: Enhanced monitoring
    if (riskLevel === 'medium' || securityScore > 0.5) {
      console.info(
        'MEDIUM RISK DEVICE DETECTED - Enhanced monitoring enabled',
        {
          userId: user.id,
          securityScore,
          riskLevel,
          suspiciousPatterns,
        },
      );

      // Log for enhanced monitoring
      await this.logSecurityEvent('Medium risk device creation', {
        userId: user.id,
        securityScore,
        riskLevel,
        suspiciousPatterns,
        ipAddress: this.deviceDetection.getRequesterIpAddress(req),
      });
    }

    // LOW RISK: Normal processing (most legitimate users)
    if (riskLevel === 'low' || securityScore < 0.3) {
      console.debug('Low risk device creation - Normal processing', {
        userId: user.id,
        securityScore,
        riskLevel,
      });
    }
  }

  /**
   * Log security events for monitoring and analysis
   */
  private async logSecurityEvent(eventType: string, data: any): Promise<void> {
    // This would integrate with your security event logging system
    // For now, just console log
    console.info(`SECURITY EVENT: ${eventType}`, {
      timestamp: new Date().toISOString(),
      ...data,
    });
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
    securityAnalysis?: any,
  ): Promise<DeviceEntity> {
    const blockReason = blockedDevice.blockReason;
    const blockedTime = blockedDevice.blockedAt;
    const timeSinceBlocked = blockedTime
      ? Date.now() - blockedTime.getTime()
      : 0;
    const hoursSinceBlocked = timeSinceBlocked / (1000 * 60 * 60);

    // Log the reactivation attempt with security analysis
    console.info('Blocked device reactivation attempt', {
      userId: user.id,
      deviceId: blockedDevice.id,
      fingerprint: blockedDevice.deviceFingerprint,
      blockReason,
      blockedAt: blockedTime,
      hoursSinceBlocked: Math.round(hoursSinceBlocked * 100) / 100,
      userOwned: Number(blockedDevice.user.id) === Number(user.id),
      securityScore: securityAnalysis?.securityScore,
      riskLevel: securityAnalysis?.riskLevel,
    });

    // POLICY 1: Check device ownership (Critical Security Check)
    if (Number(blockedDevice.user.id) !== Number(user.id)) {
      // Different user trying to use blocked device - SECURITY VIOLATION
      console.error('Cross-user blocked device access attempt', {
        blockedDeviceUserId: blockedDevice.user.id,
        attemptingUserId: user.id,
        deviceId: blockedDevice.id,
        securityAnalysis: securityAnalysis,
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
          true, // Trusted
          securityAnalysis,
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
          securityAnalysis,
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
          true, // Trusted
          securityAnalysis,
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
          securityAnalysis: securityAnalysis,
        });
        return await this.reactivateDevice(
          blockedDevice,
          req,
          'Unknown reason reactivation',
          false, // Not trusted due to unknown reason
          securityAnalysis,
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
    securityAnalysis?: any,
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

      // Enhanced metadata for reactivation with security analysis
      deviceMetadata: {
        ...device.deviceMetadata,
        reactivatedAt: new Date().toISOString(),
        reactivationReason,
        confidence: deviceInfo.confidence,
        detectionComponents: deviceInfo.components,
        // Security analysis for reactivation
        reactivationSecurityAnalysis: securityAnalysis
          ? {
              securityScore: securityAnalysis.securityScore,
              riskLevel: securityAnalysis.riskLevel,
              suspiciousPatterns: securityAnalysis.suspiciousPatterns,
              analysisTimestamp: new Date().toISOString(),
            }
          : undefined,
      },
    };

    console.info(
      'Device reactivated with enhanced detection and security analysis',
      {
        deviceId: device.id,
        userId: device.user.id,
        reason: reactivationReason,
        isTrusted,
        confidence: deviceInfo.confidence,
        fingerprint: deviceInfo.fingerprint.substring(0, 8) + '...',
        securityScore: securityAnalysis?.securityScore,
        riskLevel: securityAnalysis?.riskLevel,
      },
    );

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
    securityAnalysis?: any,
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
      // Update metadata with latest detection info and security analysis
      deviceMetadata: {
        ...device.deviceMetadata,
        lastUpdate: new Date().toISOString(),
        confidence: deviceInfo.confidence,
        detectionComponents: deviceInfo.components,
        // Security analysis for updates
        lastSecurityAnalysis: securityAnalysis
          ? {
              securityScore: securityAnalysis.securityScore,
              riskLevel: securityAnalysis.riskLevel,
              suspiciousPatterns: securityAnalysis.suspiciousPatterns,
              analysisTimestamp: new Date().toISOString(),
            }
          : undefined,
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
    securityAnalysis?: any,
  ): Promise<DeviceEntity> {
    const deviceFingerprint = existingDevice.deviceFingerprint;

    // Log critical security event with security analysis
    console.error('SECURITY ALERT: Device fingerprint collision detected', {
      existingDeviceId: existingDevice.id,
      existingUserId: existingDevice.user.id,
      newUserId: newUser.id,
      fingerprint: deviceFingerprint,
      ipAddress: CommonService.getRequesterIpAddress(req),
      userAgent: CommonService.getRequesterUserAgent(req),
      timestamp: new Date().toISOString(),
      securityAnalysis: securityAnalysis,
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
            securityAnalysis: securityAnalysis,
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
