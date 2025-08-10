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
import { SessionRepository } from '../repositories/session.repository';
import { DeviceEntity } from './device.entity';
import { UserEntity } from './user.entity';

export enum SessionTerminationReason {
  LOGOUT = 'logout',
  TIMEOUT = 'timeout',
  REVOKED = 'revoked',
  DEVICE_REMOVED = 'device_removed',
  SESSION_LIMIT_ENFORCED = 'session_limit_enforced',
}

/**
 * SessionEntity - Manages user authentication sessions and access control
 *
 * This entity represents active user sessions in the identity provider system.
 * It tracks authentication state, access tokens, device information, and session
 * lifecycle management including creation, activity tracking, and termination.
 *
 * Key responsibilities:
 * - Store session authentication tokens (access/refresh)
 * - Track user activity and session expiration
 * - Manage device associations and location data
 * - Handle session termination and cleanup
 * - Store granted permissions for the session
 * - Provide audit trail for security monitoring
 *
 * Security considerations:
 * - Tokens are stored as hashes for security
 * - Session expiration is enforced
 * - Device fingerprinting for suspicious activity detection
 * - IP and geolocation tracking for security monitoring
 */
@Entity({ tableName: 'sessions', repository: () => SessionRepository })
export class SessionEntity extends BaseEntity {
  [EntityRepositoryType]?: SessionRepository;

  /**
   * Fields that are optional during entity creation or updates
   * These fields can be null/undefined and don't require explicit values
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
   * Associated user account for this session.
   * Many-to-one relationship - one user can have multiple sessions.
   * Cascade delete: When user is deleted, this session is automatically deleted.
   */
  @ManyToOne(() => UserEntity, {
    fieldName: 'user_id',
    nullable: false,
  })
  @Index({ name: 'idx_user_active', properties: ['user', 'terminatedAt'] })
  user!: UserEntity;

  /**
   * Associated device for this session (optional).
   * Many-to-one relationship - one device can have multiple sessions.
   * Cascade delete: When device is deleted, this session is automatically deleted.
   */
  @ManyToOne(() => DeviceEntity, {
    fieldName: 'device_id',
    nullable: true,
  })
  device?: DeviceEntity;

  /**
   * Unique session identifier used in API calls and token validation
   * Generated when session is created, used as session reference
   * Must be unique across all sessions for proper session management
   * Used in JWT tokens and session validation logic
   */
  @Property({
    fieldName: 'session_id',
    unique: true,
    serializedName: 'session_id',
    type: 'varchar',
    length: 36,
  })
  @Index({ name: 'idx_session_id' })
  sessionId!: string;

  /**
   * Hashed access token for this session (optional)
   * Stored as hash for security - original token not persisted
   * Nullable because some sessions may not use access tokens
    * Used for token validation and session security verification

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
   * Stored as hash for security - original token not persisted
   * Nullable because some sessions may not use refresh tokens
   * Used for token refresh operations and session renewal
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
   * Stored as JSON array of permission strings
   * Nullable because sessions may inherit permissions from user roles
   * Used for fine-grained access control and permission validation
   * Example: ['read:profile', 'write:posts', 'admin:users']
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
   * Captured during session creation for security monitoring
   * Nullable because some clients may not provide user agent
   * Used for session fingerprinting and suspicious activity detection
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
   * Captured during session creation for security monitoring
   * Nullable because IP may not be available in all contexts
   * Used for geolocation tracking and security policy enforcement
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
   * Stored as JSON object with location information
   * Nullable because geolocation may not be available or enabled
   * Used for security monitoring and compliance reporting
   * Example: { country: 'US', city: 'New York', lat: 40.7128, lng: -74.0060 }
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
   * Automatically set when entity is created
   * Used for session age tracking and cleanup operations
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
   * Updated on each API call or user interaction
   * Used for session timeout calculations and activity monitoring
   * Required field - sessions must track activity for security
   */
  @Property({
    fieldName: 'last_activity_at',
    serializedName: 'last_activity_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_last_activity' })
  lastActivityAt: Date = new Date();

  /**
   * Timestamp when this session expires
   * Set during session creation based on session policy
   * Used for automatic session cleanup and expiration enforcement
   * Required field - all sessions must have an expiration time
   */
  @Property({
    fieldName: 'expires_at',
    serializedName: 'expires_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_session_expires_at' })
  expiresAt: Date = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 day from now

  /**
   * Timestamp when the session expires
   * Set during session creation based on session policy
   * Used for automatic session cleanup and expiration enforcement
   * Required field - all sessions must have an max expiration time
   */
  @Property({
    fieldName: 'max_expires_at',
    serializedName: 'max_expires_at',
    type: 'timestamp',
    nullable: false,
  })
  maxExpiresAt: Date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now

  /**
   * Timestamp when the session was terminated (optional)
   * Set when session is manually terminated or expires
   * Nullable because active sessions don't have termination time
   * Used for session history and audit trail maintenance
   */
  @Property({
    fieldName: 'terminated_at',
    serializedName: 'terminated_at',
    nullable: true,
    type: 'timestamp',
  })
  terminatedAt?: Date;

  /**
   * Reason for session termination (optional)
   * Human-readable description of why session was ended
   * Nullable because active sessions don't have termination reasons
   * Used for security analysis and user support
   * Examples: 'User logout', 'Security policy violation', 'Session timeout'
   */
  @Property({
    fieldName: 'termination_reason',
    serializedName: 'termination_reason',
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  @Enum(() => SessionTerminationReason)
  terminationReason?: SessionTerminationReason;

  /**
   * Whether this session should be remembered across browser sessions
   * Defaults to false for security - only set true for "remember me" functionality
   * Used for session persistence policy and security decisions
   * Affects session timeout and cleanup behavior
   */
  @Property({
    fieldName: 'is_remembered',
    serializedName: 'is_remembered',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  isRemembered: boolean = false;
}
