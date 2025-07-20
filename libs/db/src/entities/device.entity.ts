import {
  BaseEntity,
  Collection,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { DeviceRepository } from '../repositories/device.repository';
import { SessionEntity } from './session.entity';
import { UserEntity } from './user.entity';

/**
 * Device entity for tracking and managing user devices across sessions.
 *
 * This entity handles:
 * - Device identification and fingerprinting
 * - Device trust management and security policies
 * - Session tracking across multiple devices
 * - Device metadata and technical specifications
 * - Security monitoring and device blocking
 * - Multi-device authentication support
 */
@Entity({ tableName: 'devices', repository: () => DeviceRepository })
export class DeviceEntity extends BaseEntity {
  [EntityRepositoryType]?: DeviceRepository;
  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields are nullable or may not be set initially.
   */
  [OptionalProps]?:
    | 'deviceName' // User-friendly name for the device (nullable)
    | 'osName' // Operating system name (nullable)
    | 'osVersion' // Operating system version (nullable)
    | 'browserName' // Web browser name (nullable)
    | 'browserVersion' // Web browser version (nullable)
    | 'userAgent' // User agent string from the browser/client (nullable)
    | 'lastIpAddress'; // Last known IP address of this device (nullable)

  /** Unique identifier for the device record */
  @PrimaryKey()
  id!: number;

  /**
   * Associated user account that owns this device.
   * Many-to-one relationship - one user can have multiple devices.
   */
  @ManyToOne({ fieldName: 'user_id' })
  user!: UserEntity;

  /**
   * Unique device fingerprint for device identification.
   * Generated from hardware/software characteristics to uniquely identify devices.
   * Used for device recognition across sessions and security monitoring.
   */
  @Property({
    fieldName: 'device_fingerprint',
    serializedName: 'device_fingerprint',
  })
  @Unique()
  deviceFingerprint!: string;

  /**
   * User-friendly name for the device (e.g., "John's iPhone", "Work Laptop").
   * Can be set by the user for easier device management.
   */
  @Property({
    fieldName: 'device_name',
    serializedName: 'device_name',
    nullable: true,
  })
  deviceName?: string;

  /**
   * Device category (mobile, desktop, tablet, etc.).
   * Used for device-specific features and security policies.
   */
  @Property({ fieldName: 'device_type', serializedName: 'device_type' })
  deviceType!: string; // mobile/desktop/tablet

  /**
   * Operating system name (e.g., "Windows", "macOS", "iOS", "Android").
   * Used for device-specific features and security policies.
   */
  @Property({ fieldName: 'os_name', serializedName: 'os_name', nullable: true })
  osName?: string;

  /**
   * Operating system version (e.g., "10.15.7", "14.0").
   * Used for security assessments and compatibility checks.
   */
  @Property({
    fieldName: 'os_version',
    serializedName: 'os_version',
    nullable: true,
  })
  osVersion?: string;

  /**
   * Web browser name (e.g., "Chrome", "Safari", "Firefox").
   * Used for browser-specific features and security policies.
   */
  @Property({
    fieldName: 'browser_name',
    serializedName: 'browser_name',
    nullable: true,
  })
  browserName?: string;

  /**
   * Web browser version (e.g., "91.0.4472.124").
   * Used for security assessments and compatibility checks.
   */
  @Property({
    fieldName: 'browser_version',
    serializedName: 'browser_version',
    nullable: true,
  })
  browserVersion?: string;

  /**
   * Additional device information stored as JSON.
   * Flexible storage for screen resolution, hardware specs, etc.
   * NOT USED
   */
  // @Property({ name: 'device_metadata', type: 'json', nullable: true })
  // deviceMetadata?: Record<string, unknown>;

  /**
   * Whether this device is trusted by the user.
   * Trusted devices may have relaxed security requirements.
   * Defaults to false for new devices.
   */
  @Property({
    fieldName: 'is_trusted',
    serializedName: 'is_trusted',
    default: false,
  })
  isTrusted: boolean = false;

  /**
   * Whether this device is managed by an organization (MDM).
   * Managed devices may have different security policies.
   * Defaults to false for personal devices.
   * NOT USED
   */
  // @Property({ name: 'is_managed', default: false })
  // isManaged: boolean = false;

  /**
   * Timestamp when this device was first seen/registered.
   * Used for device age tracking and security assessments.
   * NOT USED
   */
  // @Property({ name: 'first_seen_at' })
  // firstSeenAt!: Date;

  /**
   * Timestamp when this device was last active.
   * Used for device activity tracking and cleanup of inactive devices.
   */
  @Property({ fieldName: 'last_seen_at', serializedName: 'last_seen_at' })
  lastSeenAt!: Date;

  /**
   * Timestamp when this device was marked as trusted.
   * Used for trust relationship tracking and security audits.
   * NOT USED
   */
  // @Property({ name: 'trusted_at', nullable: true })
  // trustedAt?: Date;

  /**
   * Timestamp when this device was blocked/blacklisted.
   * Used for security incident tracking and device management.
   * NOT USED
   */
  // @Property({ name: 'blocked_at', nullable: true })
  // blockedAt?: Date;

  /**
   * Reason for blocking this device (security violation, policy breach, etc.).
   * Used for security audits and incident response.
   * NOT USED
   */
  // @Property({ name: 'block_reason', nullable: true })
  // blockReason?: string;

  /**
   * User agent string from the browser/client.
   * Used for device identification and security monitoring.
   */
  @Property({
    fieldName: 'user_agent',
    serializedName: 'user_agent',
    nullable: true,
  })
  userAgent?: string;

  /**
   * Last known IP address of this device.
   * Used for security monitoring, geolocation, and fraud detection.
   */
  @Property({
    fieldName: 'last_ip_address',
    serializedName: 'last_ip_address',
    nullable: true,
  })
  lastIpAddress?: string;

  /**
   * Timestamp when the device record was created.
   * Automatically set on entity creation.
   */
  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    onCreate: () => new Date(),
  })
  createdAt: Date = new Date();

  /**
   * Timestamp when the device record was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({
    fieldName: 'updated_at',
    serializedName: 'updated_at',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  // ========================================
  // RELATIONSHIPS
  // ========================================

  /**
   * Active sessions associated with this device.
   * One-to-many relationship - one device can have multiple active sessions.
   * Used for session management and device activity tracking.
   */
  @OneToMany(() => SessionEntity, (session) => session.device)
  sessions = new Collection<SessionEntity>(this);

  // ========================================
  // DEPRECATED/COMMENTED FIELDS
  // ========================================
  // These fields were replaced by the current implementation above
  // and are kept for reference only.

  // @Property({ fieldName: 'device_info', type: 'text', nullable: true })
  // deviceInfo?: string;

  // @Property({ fieldName: 'refresh_token', type: 'text', nullable: true })
  // refreshToken?: string;

  // @Property({ fieldName: 'user_agent', type: 'text', nullable: true })
  // userAgent?: string;

  // @Property({ fieldName: 'ip', nullable: true })
  // ip?: string;

  // @Property({ fieldName: 'is_trusted', nullable: true })
  // isTrusted?: boolean;

  // @Property({ fieldName: 'last_activity', nullable: true })
  // lastActivity?: Date;

  // @Property({ fieldName: 'created_on' })
  // createdOn!: Date;

  // @Property({ fieldName: 'expired_on', nullable: true })
  // expiredOn?: Date;

  // @Property({ fieldName: 'terminated_on', nullable: true })
  // terminatedOn?: Date;
}
