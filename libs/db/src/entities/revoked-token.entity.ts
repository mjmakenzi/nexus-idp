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
import { RevokedTokenRepository } from '../repositories/revoked-token.repository';
import { UserEntity } from './user.entity';

/**
 * Revoked token entity for tracking invalidated authentication tokens.
 *
 * This entity handles:
 * - Token revocation tracking for security
 * - Audit trail of token lifecycle (issued, expired, revoked)
 * - Revocation reasons and responsible parties
 * - Token type management (access, refresh, API, reset)
 * - Security incident response and compliance
 * - Token blacklisting for session invalidation
 */
@Entity({
  tableName: 'revoked_tokens',
  repository: () => RevokedTokenRepository,
})
export class RevokedTokenEntity extends BaseEntity {
  [EntityRepositoryType]?: RevokedTokenRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields are nullable or may not be set initially.
   */
  [OptionalProps]?:
    | 'userAgent' // User agent string from the client (nullable)
    | 'ipAddress'; // IP address of the client (nullable)

  /** Unique identifier for the revoked token record */
  @PrimaryKey()
  id!: number;

  /**
   * Associated user account that owned the revoked token.
   * Many-to-one relationship - one user can have multiple revoked tokens.
   */
  @ManyToOne({ name: 'user_id' })
  user!: UserEntity;

  /**
   * Hashed value of the revoked token for security.
   * Never store plain text tokens - only hashed values for blacklisting.
   * Used to check if a token has been revoked during validation.
   */
  @Property({ name: 'token_hash' })
  @Unique()
  tokenHash!: string;

  /**
   * Type of token that was revoked (access, refresh, api, reset).
   * Determines the token's purpose and validation rules.
   * Used for token lifecycle management and security policies.
   */
  @Property({ name: 'token_type' })
  tokenType!: string; // access / refresh / api / reset

  /**
   * JWT ID (JTI) for unique token identification.
   * Optional field for JWT tokens that include a JTI claim.
   * Used for token tracking and duplicate prevention.
   * NOT USED
   */
  // @Property({ nullable: true })
  // jti?: string;

  /**
   * User agent string from the client that used the token.
   * Used for security monitoring and audit trail.
   */
  @Property({ name: 'user_agent', nullable: true })
  userAgent?: string;

  /**
   * IP address of the client that used the token.
   * Used for security monitoring, geolocation tracking, and fraud detection.
   */
  @Property({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  /**
   * Timestamp when the token was originally issued.
   * Used for token lifecycle tracking and security audits.
   * NOT USED
   */
  // @Property({ name: 'issued_at' })
  // issuedAt!: Date;

  /**
   * Timestamp when the token would have naturally expired.
   * Used for token lifecycle analysis and security assessments.
   */
  @Property({ name: 'expires_at' })
  expiresAt!: Date;

  /**
   * Timestamp when the token was revoked.
   * Used for security incident tracking and audit trails.
   */
  @Property({ name: 'revoked_at' })
  revokedAt!: Date;

  /**
   * Reason for token revocation (logout, security breach, admin action, etc.).
   * Used for security incident response and compliance reporting.
   * NOT USED
   */
  // @Property({ name: 'revocation_reason' })
  // revocationReason!: string;

  /**
   * Identifier of who revoked the token (user ID, admin ID, system).
   * Used for accountability and audit trail in security incidents.
   * NOT USED
   */
  // @Property({ name: 'revoked_by', nullable: true })
  // revokedBy?: string;
}
