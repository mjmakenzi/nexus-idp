import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { SessionRepository } from '../repositories/session.repository';
import { DeviceEntity } from './device.entity';
import { UserEntity } from './user.entity';

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

  /**
   * Unique identifier for the session record
   * Auto-generated primary key for database operations
   */
  @PrimaryKey()
  id!: number;

  /**
   * The user associated with this session
   * Required relationship - every session must belong to a user
   * Used for user authentication and session management
   */
  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  /**
   * The device associated with this session (optional)
   * Links session to specific device for enhanced security tracking
   * Nullable because sessions can exist without device information
   * Used for device-based security policies and multi-device management
   */
  @ManyToOne(() => DeviceEntity, { nullable: true })
  device?: DeviceEntity;

  /**
   * Unique session identifier used in API calls and token validation
   * Generated when session is created, used as session reference
   * Must be unique across all sessions for proper session management
   * Used in JWT tokens and session validation logic
   */
  @Property({ name: 'session_id', unique: true })
  sessionId!: string;

  /**
   * Hashed access token for this session (optional)
   * Stored as hash for security - original token not persisted
   * Nullable because some sessions may not use access tokens
   * Used for token validation and session security verification
   */
  @Property({ name: 'access_token_hash', type: 'text', nullable: true })
  accessTokenHash?: string;

  /**
   * Hashed refresh token for this session (optional)
   * Stored as hash for security - original token not persisted
   * Nullable because some sessions may not use refresh tokens
   * Used for token refresh operations and session renewal
   */
  @Property({ name: 'refresh_token_hash', type: 'text', nullable: true })
  refreshTokenHash?: string;

  /**
   * Array of permissions granted to this specific session (optional)
   * Stored as JSON array of permission strings
   * Nullable because sessions may inherit permissions from user roles
   * Used for fine-grained access control and permission validation
   * Example: ['read:profile', 'write:posts', 'admin:users']
   */
  @Property({ name: 'granted_permissions', type: 'json', nullable: true })
  grantedPermissions?: string[];

  /**
   * User agent string from the client browser/application (optional)
   * Captured during session creation for security monitoring
   * Nullable because some clients may not provide user agent
   * Used for session fingerprinting and suspicious activity detection
   */
  @Property({ name: 'user_agent', nullable: true })
  userAgent?: string;

  /**
   * IP address of the client that created this session (optional)
   * Captured during session creation for security monitoring
   * Nullable because IP may not be available in all contexts
   * Used for geolocation tracking and security policy enforcement
   */
  @Property({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  /**
   * Geographic location data derived from IP address (optional)
   * Stored as JSON object with location information
   * Nullable because geolocation may not be available or enabled
   * Used for security monitoring and compliance reporting
   * Example: { country: 'US', city: 'New York', lat: 40.7128, lng: -74.0060 }
   */
  @Property({ name: 'geo_location', type: 'json', nullable: true })
  geoLocation?: Record<string, unknown>;

  /**
   * Timestamp when the session was created
   * Automatically set when entity is created
   * Used for session age tracking and cleanup operations
   */
  @Property({ name: 'created_at', onCreate: () => new Date() })
  createdAt: Date = new Date();

  /**
   * Timestamp of the last activity on this session
   * Updated on each API call or user interaction
   * Used for session timeout calculations and activity monitoring
   * Required field - sessions must track activity for security
   */
  @Property({ name: 'last_activity_at' })
  lastActivityAt!: Date;

  /**
   * Timestamp when this session expires
   * Set during session creation based on session policy
   * Used for automatic session cleanup and expiration enforcement
   * Required field - all sessions must have an expiration time
   */
  @Property({ name: 'expires_at' })
  expiresAt!: Date;

  /**
   * Timestamp when the session was terminated (optional)
   * Set when session is manually terminated or expires
   * Nullable because active sessions don't have termination time
   * Used for session history and audit trail maintenance
   */
  @Property({ name: 'terminated_at', nullable: true })
  terminatedAt?: Date;

  /**
   * Reason for session termination (optional)
   * Human-readable description of why session was ended
   * Nullable because active sessions don't have termination reasons
   * Used for security analysis and user support
   * Examples: 'User logout', 'Security policy violation', 'Session timeout'
   */
  @Property({ name: 'termination_reason', nullable: true })
  terminationReason?: string;

  /**
   * Whether this session should be remembered across browser sessions
   * Defaults to false for security - only set true for "remember me" functionality
   * Used for session persistence policy and security decisions
   * Affects session timeout and cleanup behavior
   */
  @Property({ name: 'is_remembered', default: false })
  isRemembered: boolean = false;

  // @Property({ name: 'user_agent', nullable: true })
  // userAgent?: string;

  // @Property({ fieldName: 'identifier_id' })
  // identifierId!: string;

  // @ManyToOne({ fieldName: 'user_id' })
  // user!: UserEntity;

  // @Property({ fieldName: 'access_token', type: 'text' })
  // accessToken!: string;

  // @Property({ fieldName: 'refresh_token', type: 'text' })
  // refreshToken!: string;

  // @Property({ fieldName: 'user_agent', type: 'text', nullable: true })
  // userAgent?: string;

  // @Property({ fieldName: 'ip', nullable: true })
  // ip?: string;

  // @Property({ fieldName: 'scope', nullable: true })
  // scope?: string;

  // @Property({ fieldName: 'created_on' })
  // createdOn!: Date;

  // @Property({ fieldName: 'modified_on' })
  // modifiedOn!: Date;

  // @Property({ fieldName: 'expired_on' })
  // expiredOn!: Date;
}
