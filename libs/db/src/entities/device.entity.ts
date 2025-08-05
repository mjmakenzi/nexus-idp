import {
  BaseEntity,
  Cascade,
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  Index,
  ManyToOne,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { DeviceRepository } from '../repositories/device.repository';
import { SessionEntity } from './session.entity';
import { UserEntity } from './user.entity';

export enum DeviceType {
  MOBILE = 'mobile',
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  UNKNOWN = 'unknown',
}

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
  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: number;

  /**
   * Associated user account that owns this device.
   * Many-to-one relationship - one user can have multiple devices.
   * Cascade delete: When user is deleted, this device is automatically deleted.
   */
  @ManyToOne({ fieldName: 'user_id', nullable: false })
  @Index({ name: 'idx_user_trusted', properties: ['user', 'isTrusted'] })
  user!: UserEntity;

  /**
   * Unique device fingerprint for device identification.
   * Generated from hardware/software characteristics to uniquely identify devices.
   * Used for device recognition across sessions and security monitoring.
   */
  @Property({
    fieldName: 'device_fingerprint',
    serializedName: 'device_fingerprint',
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
  })
  @Index({ name: 'idx_device_fingerprint' })
  deviceFingerprint!: string;

  /**
   * User-friendly name for the device (e.g., "John's iPhone", "Work Laptop").
   * Can be set by the user for easier device management.
   */
  @Property({
    fieldName: 'device_name',
    serializedName: 'device_name',
    nullable: true,
    type: 'varchar',
    length: 200,
  })
  deviceName?: string;

  /**
   * Device category (mobile, desktop, tablet, etc.).
   * Used for device-specific features and security policies.
   */
  @Property({
    fieldName: 'device_type',
    serializedName: 'device_type',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  @Enum(() => DeviceType)
  deviceType!: DeviceType;

  /**
   * Operating system name (e.g., "Windows", "macOS", "iOS", "Android").
   * Used for device-specific features and security policies.
   */
  @Property({
    fieldName: 'os_name',
    serializedName: 'os_name',
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  osName?: string;

  /**
   * Operating system version (e.g., "10.15.7", "14.0").
   * Used for security assessments and compatibility checks.
   */
  @Property({
    fieldName: 'os_version',
    serializedName: 'os_version',
    nullable: true,
    type: 'varchar',
    length: 20,
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
    type: 'varchar',
    length: 50,
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
    type: 'varchar',
    length: 20,
  })
  browserVersion?: string;

  /**
   * Additional device information stored as JSON.
   * Flexible storage for screen resolution, hardware specs, etc.
   */
  @Property({
    fieldName: 'device_metadata',
    serializedName: 'device_metadata',
    type: 'json',
    nullable: true,
  })
  deviceMetadata?: Record<string, unknown>;

  /**
   * Whether this device is trusted by the user.
   * Trusted devices may have relaxed security requirements.
   * Defaults to false for new devices.
   */
  @Property({
    fieldName: 'is_trusted',
    serializedName: 'is_trusted',
    default: false,
    type: 'boolean',
    nullable: false,
  })
  isTrusted: boolean = false;

  /**
   * Whether this device is managed by an organization (MDM).
   * Managed devices may have different security policies.
   * Defaults to false for personal devices.
   */
  @Property({
    fieldName: 'is_managed',
    serializedName: 'is_managed',
    default: false,
    type: 'boolean',
    nullable: false,
  })
  isManaged: boolean = false;

  /**
   * Timestamp when this device was first seen/registered.
   * Used for device age tracking and security assessments.
   */
  @Property({
    fieldName: 'first_seen_at',
    serializedName: 'first_seen_at',
    type: 'timestamp',
    nullable: false,
  })
  firstSeenAt: Date = new Date();

  /**
   * Timestamp when this device was last active.
   * Used for device activity tracking and cleanup of inactive devices.
   */
  @Property({
    fieldName: 'last_seen_at',
    serializedName: 'last_seen_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_last_seen_at' })
  lastSeenAt: Date = new Date();

  /**
   * Timestamp when this device was marked as trusted.
   * Used for trust relationship tracking and security audits.
   */
  @Property({
    fieldName: 'trusted_at',
    serializedName: 'trusted_at',
    type: 'timestamp',
    nullable: true,
  })
  trustedAt?: Date;

  /**
   * Timestamp when this device was blocked/blacklisted.
   * Used for security incident tracking and device management.
   */
  @Property({
    fieldName: 'blocked_at',
    serializedName: 'blocked_at',
    nullable: true,
    type: 'timestamp',
  })
  blockedAt?: Date;

  /**
   * Reason for blocking this device (security violation, policy breach, etc.).
   * Used for security audits and incident response.
   */
  @Property({
    fieldName: 'block_reason',
    serializedName: 'block_reason',
    nullable: true,
    type: 'varchar',
    length: 500,
  })
  blockReason?: string;

  /**
   * User agent string from the browser/client.
   * Used for device identification and security monitoring.
   */
  @Property({
    fieldName: 'user_agent',
    serializedName: 'user_agent',
    nullable: true,
    type: 'text',
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
    type: 'varchar',
    length: 45,
  })
  lastIpAddress?: string;

  /**
   * Timestamp when the device record was created.
   * Automatically set on entity creation.
   */
  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    type: 'timestamp',
    nullable: false,
  })
  createdAt: Date = new Date();

  /**
   * Timestamp when the device record was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({
    fieldName: 'updated_at',
    serializedName: 'updated_at',
    type: 'timestamp',
    nullable: false,
  })
  updatedAt: Date = new Date();

  // ========================================
  // RELATIONSHIPS
  // ========================================

  /**
   * Active sessions associated with this device.
   * One-to-many relationship - one device can have multiple active sessions.
   * Used for session management and device activity tracking.
   * Cascade delete: When device is deleted, all sessions are automatically deleted.
   */
  @OneToMany(() => SessionEntity, (session) => session.device, {
    cascade: [Cascade.REMOVE],
  })
  sessions = new Collection<SessionEntity>(this);
}
