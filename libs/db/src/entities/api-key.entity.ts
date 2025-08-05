import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  Index,
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
    | 'createdBy'; // Who created the API key (nullable)

  /** Unique identifier for the API key record */
  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: bigint;

  /**
   * Associated user account that owns this API key.
   * Many-to-one relationship - one user can have multiple API keys.
   * Cascade delete: When user is deleted, all API keys are automatically deleted.
   */
  @ManyToOne(() => UserEntity, {
    fieldName: 'user_id',
    nullable: false,
  })
  @Index({ name: 'idx_api_key_user_active', properties: ['user', 'isActive'] })
  user!: UserEntity;

  /**
   * Human-readable name for the API key (e.g., "Production API", "Testing Key").
   * Used for key management and identification purposes.
   */
  @Property({
    fieldName: 'name',
    serializedName: 'name',
    type: 'varchar',
    length: 200,
    nullable: false,
  })
  name!: string;

  /**
   * Unique identifier for the API key (not the actual key).
   * Used for key identification and management without exposing the actual key.
   * Must be unique across all API keys.
   */
  @Property({
    fieldName: 'key_id',
    serializedName: 'key_id',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  @Unique()
  @Index({ name: 'idx_key_id' })
  keyId!: string;

  /**
   * Hashed value of the actual API key for security.
   * Never store plain text API keys - only hashed values.
   * Used for key validation during API requests.
   */
  @Property({
    fieldName: 'key_hash',
    serializedName: 'key_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  keyHash!: string;

  /**
   * Prefix of the API key for identification purposes.
   * Used to identify the key type and owner without exposing the full key.
   * Example: "ak_live_", "ak_test_"
   */
  @Property({
    fieldName: 'key_prefix',
    serializedName: 'key_prefix',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  keyPrefix!: string;

  /**
   * Array of permissions granted to this API key.
   * Stored as JSON for flexible permission management.
   * Examples: ["user:read", "user:write", "admin:all"]
   */
  @Property({
    fieldName: 'allowed_permissions',
    serializedName: 'allowed_permissions',
    type: 'json',
    nullable: true,
  })
  allowedPermissions?: string[];

  /**
   * Array of IP addresses allowed to use this API key.
   * Stored as JSON for IP-based access control.
   * Used for restricting API key usage to specific networks.
   */
  @Property({
    fieldName: 'allowed_ips',
    serializedName: 'allowed_ips',
    type: 'json',
    nullable: true,
  })
  allowedIps?: string[];

  /**
   * Rate limiting configuration for this API key.
   * Stored as JSON for flexible rate limit settings.
   * Examples: {"requests_per_minute": 100, "burst_limit": 10}
   */
  @Property({
    fieldName: 'rate_limits',
    serializedName: 'rate_limits',
    type: 'json',
    nullable: true,
  })
  rateLimits?: Record<string, unknown>;

  /**
   * Timestamp when this API key was last used.
   * Used for usage tracking and cleanup of inactive keys.
   */
  @Property({
    fieldName: 'last_used_at',
    serializedName: 'last_used_at',
    nullable: true,
    type: 'timestamp',
  })
  lastUsedAt?: Date;

  /**
   * IP address of the last request using this API key.
   * Used for security monitoring and usage tracking.
   */
  @Property({
    fieldName: 'last_used_ip',
    serializedName: 'last_used_ip',
    nullable: true,
    type: 'varchar',
    length: 45,
  })
  lastUsedIp?: string;

  /**
   * Timestamp when this API key expires.
   * Used for key lifecycle management and automatic expiration.
   * Null for keys that never expire.
   */
  @Property({
    fieldName: 'expires_at',
    serializedName: 'expires_at',
    nullable: true,
    type: 'timestamp',
  })
  expiresAt?: Date;

  /**
   * Whether this API key is active and can be used.
   * Used for key management and temporary deactivation.
   * Defaults to true for new keys.
   */
  @Property({
    fieldName: 'is_active',
    serializedName: 'is_active',
    default: true,
    type: 'boolean',
    nullable: false,
  })
  isActive!: boolean;

  /**
   * Timestamp when the API key was created.
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
   * Identifier of who created the API key (user ID, admin ID).
   * Used for accountability and audit trail in key management.
   */
  @Property({
    fieldName: 'created_by',
    serializedName: 'created_by',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  createdBy?: string;
}
