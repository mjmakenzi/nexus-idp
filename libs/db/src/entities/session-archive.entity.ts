import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  Enum,
  Index,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { SessionArchiveRepository } from '../repositories/session-archive.repository';
import { DeviceEntity } from './device.entity';
import { SessionTerminationReason } from './session.entity';
import { UserEntity } from './user.entity';

/**
 * SessionArchiveEntity - Stores terminated sessions for audit and compliance
 *
 * This entity stores terminated sessions separately from active sessions
 * to optimize performance while maintaining complete audit trail.
 *
 * Key benefits:
 * - Faster queries on active sessions
 * - Complete audit trail for terminated sessions
 * - Compliance with data retention requirements
 * - Reduced performance impact on main sessions table
 */
@Entity({
  tableName: 'session_archives',
  repository: () => SessionArchiveRepository,
})
export class SessionArchiveEntity extends BaseEntity {
  [EntityRepositoryType]?: SessionArchiveRepository;

  /**
   * Fields that are optional during entity creation or updates
   */
  [OptionalProps]?:
    | 'device'
    | 'accessTokenHash'
    | 'refreshTokenHash'
    | 'grantedPermissions'
    | 'userAgent'
    | 'ipAddress'
    | 'geoLocation'
    | 'terminatedAt'
    | 'terminationReason';

  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: bigint;

  /**
   * Original session ID for reference
   */
  @Property({
    fieldName: 'original_session_id',
    serializedName: 'original_session_id',
    type: 'varchar',
    length: 36,
    nullable: false,
  })
  @Index({ name: 'idx_original_session_id' })
  originalSessionId!: string;

  /**
   * Associated user account for this session
   */
  @ManyToOne(() => UserEntity, {
    fieldName: 'user_id',
    nullable: false,
  })
  @Index({ name: 'idx_archive_user', properties: ['user', 'terminatedAt'] })
  user!: UserEntity;

  /**
   * Associated device for this session (optional)
   */
  @ManyToOne(() => DeviceEntity, {
    fieldName: 'device_id',
    nullable: true,
  })
  device?: DeviceEntity;

  /**
   * Unique session identifier used in API calls and token validation
   */
  @Property({
    fieldName: 'session_id',
    serializedName: 'session_id',
    type: 'varchar',
    length: 36,
  })
  @Index({ name: 'idx_archive_session_id' })
  sessionId!: string;

  /**
   * Hashed access token for this session (optional)
   */
  @Property({
    fieldName: 'access_token_hash',
    serializedName: 'access_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  accessTokenHash?: string;

  /**
   * Hashed refresh token for this session (optional)
   */
  @Property({
    fieldName: 'refresh_token_hash',
    serializedName: 'refresh_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  refreshTokenHash?: string;

  /**
   * Array of permissions granted to this specific session (optional)
   */
  @Property({
    fieldName: 'granted_permissions',
    serializedName: 'granted-permissions',
    type: 'json',
    nullable: true,
  })
  grantedPermissions?: string[];

  /**
   * User agent string from the client browser/application (optional)
   */
  @Property({
    fieldName: 'user_agent',
    serializedName: 'user_agent',
    nullable: true,
    type: 'text',
  })
  userAgent?: string;

  /**
   * IP address of the client that created this session (optional)
   */
  @Property({
    fieldName: 'ip_address',
    serializedName: 'ip_address',
    nullable: true,
    type: 'varchar',
    length: 45,
  })
  ipAddress?: string;

  /**
   * Geographic location data derived from IP address (optional)
   */
  @Property({
    fieldName: 'geo_location',
    serializedName: 'geo_location',
    type: 'json',
    nullable: true,
  })
  geoLocation?: Record<string, unknown>;

  /**
   * Timestamp when the session was created
   */
  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    type: 'timestamp',
    nullable: false,
  })
  createdAt: Date = new Date();

  /**
   * Timestamp of the last activity on this session
   */
  @Property({
    fieldName: 'last_activity_at',
    serializedName: 'last_activity_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_archive_last_activity' })
  lastActivityAt: Date = new Date();

  /**
   * Timestamp when this session expires
   */
  @Property({
    fieldName: 'expires_at',
    serializedName: 'expires_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_archive_expires_at' })
  expiresAt: Date = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  /**
   * Timestamp when the session expires
   */
  @Property({
    fieldName: 'max_expires_at',
    serializedName: 'max_expires_at',
    type: 'timestamp',
    nullable: false,
  })
  maxExpiresAt: Date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  /**
   * Timestamp when the session was terminated
   */
  @Property({
    fieldName: 'terminated_at',
    serializedName: 'terminated_at',
    nullable: false,
    type: 'timestamp',
  })
  @Index({ name: 'idx_archive_terminated_at' })
  terminatedAt: Date = new Date();

  /**
   * Reason for session termination
   */
  @Property({
    fieldName: 'termination_reason',
    serializedName: 'termination_reason',
    nullable: false,
    type: 'varchar',
    length: 50,
  })
  @Enum(() => SessionTerminationReason)
  terminationReason: SessionTerminationReason =
    SessionTerminationReason.ARCHIVED;

  /**
   * Whether this session should be remembered across browser sessions
   */
  @Property({
    fieldName: 'is_remembered',
    serializedName: 'is_remembered',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isRemembered: boolean = false;

  /**
   * Timestamp when this session was archived
   */
  @Property({
    fieldName: 'archived_at',
    serializedName: 'archived_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_archived_at' })
  archivedAt: Date = new Date();

  /**
   * Retention period in days (for compliance)
   */
  @Property({
    fieldName: 'retention_days',
    serializedName: 'retention_days',
    type: 'integer',
    nullable: false,
    default: 2555, // 7 years default
  })
  retentionDays: number = 2555;

  /**
   * Timestamp when this archive should be deleted (retention expiry)
   */
  @Property({
    fieldName: 'retention_expires_at',
    serializedName: 'retention_expires_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_retention_expires_at' })
  retentionExpiresAt: Date = new Date(Date.now() + 2555 * 24 * 60 * 60 * 1000);
}
