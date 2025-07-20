import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { FederatedIdentityRepository } from '../repositories/federated-identity.repository';
import { UserEntity } from './user.entity';

/**
 * Federated identity entity for managing OAuth/SSO provider connections.
 *
 * This entity handles:
 * - OAuth provider account linking (Google, Apple, Facebook, GitHub, etc.)
 * - Provider-specific user data and tokens
 * - Multi-provider account management
 * - Token lifecycle and refresh management
 * - Primary identity designation and preferences
 * - Account linking audit trail and security
 */
@Entity({
  tableName: 'federated_identities',
  repository: () => FederatedIdentityRepository,
})
export class FederatedIdentityEntity extends BaseEntity {
  [EntityRepositoryType]?: FederatedIdentityRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields are nullable or may not be set initially.
   */
  [OptionalProps]?:
    | 'providerUsername' // Username from the OAuth provider (nullable)
    | 'providerEmail' // Email from the OAuth provider (nullable)
    | 'providerData' // Additional provider data (nullable)
    | 'accessTokenHash' // Hashed access token (nullable)
    | 'refreshTokenHash' // Hashed refresh token (nullable)
    | 'tokenExpiresAt' // Token expiration timestamp (nullable)
    | 'isPrimary' // Whether this is the primary identity (defaults to false)
    | 'lastUsedAt'; // Last usage timestamp (nullable)

  /** Unique identifier for the federated identity record */
  @PrimaryKey()
  id!: number;

  /**
   * Associated user account that owns this federated identity.
   * Many-to-one relationship - one user can have multiple OAuth providers.
   */
  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  /**
   * OAuth provider name (google, facebook, github, apple, etc.).
   * Used to identify which external service this identity belongs to.
   */
  @Property()
  provider!: string; // e.g., google/facebook/github/apple

  /**
   * Unique user identifier from the OAuth provider.
   * Used to link the local user account with the provider's user account.
   * Must be unique per provider.
   */
  @Property({
    fieldName: 'provider_user_id',
    serializedName: 'provider_user_id',
  })
  providerUserId!: string;

  /**
   * Username from the OAuth provider (if available).
   * Used for display purposes and user identification.
   */
  @Property({
    fieldName: 'provider_username',
    serializedName: 'provider_username',
    nullable: true,
  })
  providerUsername?: string;

  /**
   * Email address from the OAuth provider (if available).
   * Used for account linking verification and user identification.
   */
  @Property({
    fieldName: 'provider_email',
    serializedName: 'provider_email',
    nullable: true,
  })
  providerEmail?: string;

  /**
   * Additional data from the OAuth provider stored as JSON.
   * Flexible storage for profile info, preferences, and provider-specific data.
   * Examples: profile picture, name, locale, timezone, etc.
   */
  @Property({
    fieldName: 'provider_data',
    serializedName: 'provider_data',
    type: 'json',
    nullable: true,
  })
  providerData?: Record<string, unknown>;

  /**
   * Hashed access token from the OAuth provider.
   * Never store plain text tokens - only hashed values for security.
   * Used for API calls to the provider on behalf of the user.
   */
  @Property({
    fieldName: 'access_token_hash',
    serializedName: 'access_token_hash',
    nullable: true,
  })
  accessTokenHash?: string;

  /**
   * Hashed refresh token from the OAuth provider.
   * Never store plain text tokens - only hashed values for security.
   * Used to obtain new access tokens when they expire.
   */
  @Property({
    fieldName: 'refresh_token_hash',
    serializedName: 'refresh_token_hash',
    nullable: true,
  })
  refreshTokenHash?: string;

  /**
   * Timestamp when the access token expires.
   * Used for token lifecycle management and automatic refresh.
   */
  @Property({
    fieldName: 'token_expires_at',
    serializedName: 'token_expires_at',
    nullable: true,
  })
  tokenExpiresAt?: Date;

  /**
   * Whether this is the primary federated identity for the user.
   * Primary identities are used for default authentication and display.
   * Only one identity per user can be primary.
   */
  @Property({
    fieldName: 'is_primary',
    serializedName: 'is_primary',
    default: false,
  })
  isPrimary: boolean = false;

  /**
   * Timestamp when this federated identity was linked to the user account.
   * Used for account linking audit trail and relationship tracking.
   */
  @Property({ fieldName: 'linked_at', serializedName: 'linked_at' })
  linkedAt!: Date;

  /**
   * Timestamp when this federated identity was last used for authentication.
   * Used for activity tracking and cleanup of unused identities.
   */
  @Property({
    fieldName: 'last_used_at',
    serializedName: 'last_used_at',
    nullable: true,
  })
  lastUsedAt?: Date;

  /**
   * Timestamp when the federated identity record was created.
   * Automatically set on entity creation.
   */
  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    onCreate: () => new Date(),
  })
  createdAt: Date = new Date();

  /**
   * Timestamp when the federated identity record was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({
    fieldName: 'updated_at',
    serializedName: 'updated_at',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();
}
