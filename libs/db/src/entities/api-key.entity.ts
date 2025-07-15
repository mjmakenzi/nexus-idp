import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { ApiKeyRepository } from '../repositories/api-key.repository';
import { UserEntity } from './user.entity';

/**
 * API key entity for managing programmatic access to the system.
 *
 * This entity handles:
 * - API key generation and management
 * - Permission-based access control for API operations
 * - IP-based access restrictions and rate limiting
 * - API key lifecycle and expiration management
 * - Usage tracking and monitoring
 * - Security controls for programmatic access
 */
@Entity({ tableName: 'api_keys', repository: () => ApiKeyRepository })
export class ApiKeyEntity extends BaseEntity {
  [EntityRepositoryType]?: ApiKeyRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields are nullable or may not be set initially.
   */
  [OptionalProps]?:
    | 'allowedPermissions' // Permissions granted to this API key (nullable)
    | 'allowedIps' // IP addresses allowed to use this key (nullable)
    | 'rateLimits' // Rate limiting configuration (nullable)
    | 'lastUsedAt' // Last usage timestamp (nullable)
    | 'lastUsedIp' // IP address of last usage (nullable)
    | 'expiresAt' // Expiration timestamp (nullable)
    | 'isActive' // Whether key is active (defaults to true)
    | 'createdBy'; // Who created the API key (nullable)

  /** Unique identifier for the API key record */
  @PrimaryKey()
  id!: number;

  /**
   * Associated user account that owns this API key.
   * Many-to-one relationship - one user can have multiple API keys.
   */
  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  /**
   * Human-readable name for the API key (e.g., "Production API", "Testing Key").
   * Used for key management and identification purposes.
   */
  @Property()
  name!: string;

  /**
   * Unique identifier for the API key (not the actual key).
   * Used for key identification and management without exposing the actual key.
   * Must be unique across all API keys.
   */
  @Property({ name: 'key_id' })
  @Unique()
  keyId!: string;

  /**
   * Hashed value of the actual API key for security.
   * Never store plain text API keys - only hashed values.
   * Used for key validation during API requests.
   */
  @Property({ name: 'key_hash' })
  keyHash!: string;

  /**
   * Prefix of the API key for identification purposes.
   * Used to identify the key type and owner without exposing the full key.
   * Example: "ak_live_", "ak_test_"
   */
  @Property({ name: 'key_prefix' })
  keyPrefix!: string;

  /**
   * Array of permissions granted to this API key.
   * Stored as JSON for flexible permission management.
   * Examples: ["user:read", "user:write", "admin:all"]
   */
  @Property({ name: 'allowed_permissions', type: 'json', nullable: true })
  allowedPermissions?: string[];

  /**
   * Array of IP addresses allowed to use this API key.
   * Stored as JSON for IP-based access control.
   * Used for restricting API key usage to specific networks.
   */
  @Property({ name: 'allowed_ips', type: 'json', nullable: true })
  allowedIps?: string[];

  /**
   * Rate limiting configuration for this API key.
   * Stored as JSON for flexible rate limit settings.
   * Examples: {"requests_per_minute": 100, "burst_limit": 10}
   */
  @Property({ name: 'rate_limits', type: 'json', nullable: true })
  rateLimits?: Record<string, unknown>;

  /**
   * Timestamp when this API key was last used.
   * Used for usage tracking and cleanup of inactive keys.
   */
  @Property({ name: 'last_used_at', nullable: true })
  lastUsedAt?: Date;

  /**
   * IP address of the last request using this API key.
   * Used for security monitoring and usage tracking.
   */
  @Property({ name: 'last_used_ip', nullable: true })
  lastUsedIp?: string;

  /**
   * Timestamp when this API key expires.
   * Used for key lifecycle management and automatic expiration.
   * Null for keys that never expire.
   */
  @Property({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  /**
   * Whether this API key is active and can be used.
   * Used for key management and temporary deactivation.
   * Defaults to true for new keys.
   */
  @Property({ name: 'is_active', default: true })
  isActive: boolean = true;

  /**
   * Timestamp when the API key was created.
   * Automatically set on entity creation.
   */
  @Property({ name: 'created_at', onCreate: () => new Date() })
  createdAt: Date = new Date();

  /**
   * Identifier of who created the API key (user ID, admin ID).
   * Used for accountability and audit trail in key management.
   */
  @Property({ name: 'created_by', nullable: true })
  createdBy?: string;
}
