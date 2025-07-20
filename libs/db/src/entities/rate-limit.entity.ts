import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { RateLimitRepository } from '../repositories/rate-limit.repository';

/**
 * Rate limit entity for managing request throttling and abuse prevention.
 *
 * This entity handles:
 * - Request rate limiting across different scopes (user, IP, global)
 * - Time-window based throttling with configurable limits
 * - Automatic blocking and unblocking mechanisms
 * - Rate limit tracking and enforcement
 * - Abuse prevention and DoS protection
 * - Flexible rate limiting for various operations
 */
@Entity({ tableName: 'rate_limits', repository: () => RateLimitRepository })
export class RateLimitEntity extends BaseEntity {
  [EntityRepositoryType]?: RateLimitRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields are nullable or may not be set initially.
   */
  [OptionalProps]?:
    | 'blockedUntil' // Timestamp until which the identifier is blocked (nullable)
    | 'ipAddress' // IP address associated with the rate limit (nullable)
    | 'metadata'; // Additional context data (nullable)

  /** Unique identifier for the rate limit record */
  @PrimaryKey()
  id!: number;

  /**
   * Unique identifier for the rate limit (userId, IP address, email, etc.).
   * Used to track and enforce rate limits for specific entities.
   * Examples: "user_123", "192.168.1.1", "john@example.com"
   */
  @Property()
  identifier!: string; // e.g. userId, IP, email, etc.

  /**
   * Type of operation being rate limited (login, otp, api, etc.).
   * Used to apply different rate limits for different operations.
   * Examples: "login", "otp_send", "api_request", "password_reset"
   */
  @Property({ fieldName: 'limit_type', serializedName: 'limit_type' })
  limitType!: string; // e.g. login, otp, api

  /**
   * Scope of the rate limit (global, user, ip).
   * Determines how the rate limit is applied and enforced.
   * Examples: "global" (system-wide), "user" (per user), "ip" (per IP)
   */
  @Property()
  scope!: string; // global/user/ip

  /**
   * Current number of attempts made within the time window.
   * Incremented with each request and reset when window expires.
   */
  @Property()
  attempts!: number;

  /**
   * Maximum number of attempts allowed within the time window.
   * When attempts reach this limit, the identifier is blocked.
   */
  @Property({ fieldName: 'max_attempts', serializedName: 'max_attempts' })
  maxAttempts!: number;

  /**
   * Duration of the rate limit window in seconds.
   * Used to calculate window boundaries and reset attempts.
   * Examples: 60 (1 minute), 3600 (1 hour), 86400 (1 day)
   */
  @Property({ fieldName: 'window_seconds', serializedName: 'window_seconds' })
  windowSeconds!: number;

  /**
   * Start timestamp of the current rate limit window.
   * Used to determine if the window has expired and needs reset.
   */
  @Property({ fieldName: 'window_start', serializedName: 'window_start' })
  windowStart!: Date;

  /**
   * End timestamp of the current rate limit window.
   * Used to determine when the window expires and attempts reset.
   */
  @Property({ fieldName: 'window_end', serializedName: 'window_end' })
  windowEnd!: Date;

  /**
   * Timestamp until which the identifier is blocked.
   * Set when max attempts are reached, null when not blocked.
   * Used for temporary blocking and automatic unblocking.
   */
  @Property({
    fieldName: 'blocked_until',
    serializedName: 'blocked_until',
    nullable: true,
  })
  blockedUntil?: Date;

  /**
   * IP address associated with this rate limit record.
   * Used for IP-based rate limiting and security monitoring.
   */
  @Property({
    fieldName: 'ip_address',
    serializedName: 'ip_address',
    nullable: true,
  })
  ipAddress?: string;

  /**
   * Additional context data stored as JSON.
   * Flexible storage for user agent, request details, error messages, etc.
   * Examples: {"user_agent": "Chrome/91.0", "reason": "brute_force"}
   */
  @Property({ fieldName: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  /**
   * Timestamp when the rate limit record was created.
   * Automatically set on entity creation.
   */
  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    onCreate: () => new Date(),
  })
  createdAt: Date = new Date();

  /**
   * Timestamp when the rate limit record was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({
    fieldName: 'updated_at',
    serializedName: 'updated_at',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
