import {
  BaseEntity,
  Collection,
  Entity,
  EntityRepositoryType,
  OneToMany,
  OneToOne,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { UserRepository } from '../repositories/user.repository';
import { ApiKeyEntity } from './api-key.entity';
import { DeviceEntity } from './device.entity';
import { FederatedIdentityEntity } from './federated-identity.entity';
import { OtpEntity } from './otp.entity';
import { ProfileEntity } from './profile.entity';
import { SecurityEventEntity } from './security-event.entity';
import { SessionEntity } from './session.entity';
import { UserRoleEntity } from './user-role.entity';

/**
 * User entity representing a user account in the identity provider system.
 *
 * This entity handles:
 * - Core user identification (username, email, phone)
 * - Authentication credentials (password, MFA, federated identities)
 * - Account status and verification states
 * - Security tracking (login attempts, locks, sessions)
 * - Compliance tracking (terms acceptance, privacy consent)
 * - Audit trail (creation, updates, deletion)
 */
@Entity({ tableName: 'users', repository: () => UserRepository })
export class UserEntity extends BaseEntity {
  [EntityRepositoryType]?: UserRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These are primarily nullable fields and relationships that may not be set initially.
   */
  [OptionalProps]?:
    | 'deletedAt' // Soft delete timestamp
    | 'createdBy' // User who created this account (for admin operations)
    | 'updatedBy' // User who last updated this account
    | 'federatedIdentities' // OAuth/SSO identities (Google, Apple, etc.)
    | 'userRoles' // User's assigned roles and permissions
    | 'otps' // One-time password codes for authentication
    | 'sessions' // Active user sessions
    | 'devices' // Trusted devices for the user
    | 'apiKeys' // API access keys for programmatic access
    | 'securityEvents' // Security audit trail
    | 'profile' // Extended user profile information
    | 'passwordHash' // Hashed password (null for OAuth users)
    | 'passwordSalt' // Password salt for security
    | 'passwordChangedAt' // Last password change timestamp
    | 'totpSecret' // Time-based OTP secret for MFA
    | 'backupCodes' // Backup codes for MFA recovery
    | 'emailVerifiedAt' // Email verification timestamp
    | 'phoneVerifiedAt' // Phone verification timestamp
    | 'identityVerifiedAt' // Identity verification timestamp
    | 'mfaEnabled' // Whether MFA is enabled
    | 'mfaMethod' // MFA method (totp, sms, email)
    | 'failedLoginAttempts' // Count of failed login attempts
    | 'lockedUntil' // Account lock expiration timestamp
    | 'lastLoginAt' // Last successful login timestamp
    | 'lastLoginIp' // IP address of last login
    | 'status' // Account status (active, suspended, etc.)
    | 'termsAcceptedAt' // Terms of service acceptance timestamp
    | 'termsVersion' // Version of terms accepted
    | 'privacyAcceptedAt'; // Privacy policy acceptance timestamp

  /** Unique identifier for the user account */
  @PrimaryKey()
  id!: number;

  /**
   * Unique username for login and display purposes.
   * Must be unique across all users in the system.
   */
  @Property()
  @Unique()
  username!: string;

  /**
   * Primary email address for the user account.
   * Used for login, notifications, and account recovery.
   * Must be unique across all users.
   */
  @Property()
  @Unique()
  email!: string;

  /**
   * Normalized email address (lowercase, trimmed) for consistent lookups.
   * Used for case-insensitive email searches and comparisons.
   */
  @Property({ name: 'email_normalized' })
  @Unique()
  emailNormalized!: string;

  /**
   * Phone number for SMS-based authentication and notifications.
   * Optional - not all users provide phone numbers.
   */
  @Property({ name: 'phone_number', nullable: true })
  phoneNumber?: string;

  /**
   * Country code for international phone number formatting.
   * Used with phoneNumber for SMS operations.
   */
  @Property({ name: 'country_code', nullable: true })
  countryCode?: string;

  /**
   * External system identifier for integration purposes.
   * Used when syncing users from external systems.
   */
  @Property({ name: 'external_id', nullable: true })
  externalId?: string;

  /**
   * Bcrypt-hashed password for local authentication.
   * Null for users who only authenticate via OAuth/SSO.
   */
  @Property({ name: 'password_hash', nullable: true })
  passwordHash?: string;

  /**
   * Salt used for password hashing to prevent rainbow table attacks.
   * Generated uniquely for each password.
   */
  @Property({ name: 'password_salt', nullable: true })
  passwordSalt?: string;

  /**
   * Timestamp when the password was last changed.
   * Used for password expiration policies and security audits.
   */
  @Property({ name: 'password_changed_at', nullable: true })
  passwordChangedAt?: Date;

  /**
   * Password version for tracking password changes.
   * Incremented when password is changed to invalidate old sessions.
   */
  @Property({ name: 'password_version' })
  passwordVersion!: number;

  /**
   * Secret key for Time-based One-Time Password (TOTP) generation.
   * Used for MFA authentication via authenticator apps.
   */
  @Property({ name: 'totp_secret', nullable: true })
  totpSecret?: string;

  /**
   * Backup codes for MFA recovery when TOTP is unavailable.
   * Stored as hashed values for security.
   */
  @Property({ name: 'backup_codes', type: 'json', nullable: true })
  backupCodes?: string[];

  /**
   * Timestamp when email address was verified.
   * Required for certain account operations and security features.
   */
  @Property({ name: 'email_verified_at', nullable: true })
  emailVerifiedAt?: Date;

  /**
   * Timestamp when phone number was verified via SMS.
   * Required for SMS-based authentication and notifications.
   */
  @Property({ name: 'phone_verified_at', nullable: true })
  phoneVerifiedAt?: Date;

  /**
   * Timestamp when user identity was verified (KYC process).
   * Required for high-security operations and compliance.
   */
  @Property({ name: 'identity_verified_at', nullable: true })
  identityVerifiedAt?: Date;

  /**
   * Whether Multi-Factor Authentication is enabled for this account.
   * Defaults to false for new accounts.
   */
  @Property({ default: false })
  mfaEnabled: boolean = false;

  /**
   * Method used for MFA (totp, sms, email, etc.).
   * Determines which MFA flow to use during authentication.
   */
  @Property({ name: 'mfa_method', nullable: true })
  mfaMethod?: string;

  /**
   * Counter for consecutive failed login attempts.
   * Used to implement account lockout policies.
   */
  @Property({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number = 0;

  /**
   * Timestamp until which the account is locked due to security violations.
   * Null when account is not locked.
   */
  @Property({ name: 'locked_until', nullable: true })
  lockedUntil?: Date;

  /**
   * Timestamp of the last successful login.
   * Used for activity tracking and security monitoring.
   */
  @Property({ name: 'last_login_at', nullable: true })
  lastLoginAt?: Date;

  /**
   * IP address of the last successful login.
   * Used for security monitoring and fraud detection.
   */
  @Property({ name: 'last_login_ip', nullable: true })
  lastLoginIp?: string;

  /**
   * Current account status (active, suspended, pending, etc.).
   * Controls whether the user can access the system.
   */
  @Property()
  status!: string;

  /**
   * Timestamp when user accepted the Terms of Service.
   * Required for account activation and compliance.
   */
  @Property({ name: 'terms_accepted_at', nullable: true })
  termsAcceptedAt?: Date;

  /**
   * Version of Terms of Service that was accepted.
   * Used to track policy changes and re-acceptance requirements.
   */
  @Property({ name: 'terms_version', nullable: true })
  termsVersion?: string;

  /**
   * Timestamp when user accepted the Privacy Policy.
   * Required for GDPR compliance and data processing consent.
   */
  @Property({ name: 'privacy_accepted_at', nullable: true })
  privacyAcceptedAt?: Date;

  /**
   * Timestamp when the user account was created.
   * Automatically set on entity creation.
   */
  @Property({ name: 'created_at', onCreate: () => new Date() })
  createdAt: Date = new Date();

  /**
   * Timestamp when the user account was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({ name: 'updated_at', onUpdate: () => new Date() })
  updatedAt: Date = new Date();

  /**
   * Soft delete timestamp for account deactivation.
   * Null for active accounts, set to deletion date for deactivated accounts.
   */
  @Property({ name: 'deleted_at', nullable: true })
  deletedAt?: Date;

  /**
   * Identifier of the user/admin who created this account.
   * Used for audit trails in admin operations.
   */
  @Property({ name: 'created_by', nullable: true })
  createdBy?: string;

  /**
   * Identifier of the user/admin who last updated this account.
   * Used for audit trails in admin operations.
   */
  @Property({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  // ========================================
  // RELATIONSHIPS
  // ========================================

  /**
   * Extended user profile information (name, avatar, preferences, etc.).
   * One-to-one relationship - each user has at most one profile.
   */
  @OneToOne(() => ProfileEntity, (profile) => profile.user, { nullable: true })
  profile?: ProfileEntity;

  /**
   * OAuth/SSO identities linked to this user account.
   * One-to-many relationship - user can have multiple OAuth providers.
   * Examples: Google, Apple, Facebook, GitHub, etc.
   */
  @OneToMany(() => FederatedIdentityEntity, (identity) => identity.user)
  federatedIdentities = new Collection<FederatedIdentityEntity>(this);

  /**
   * User's assigned roles and permissions.
   * One-to-many relationship - user can have multiple roles.
   * Used for authorization and access control.
   */
  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user)
  userRoles = new Collection<UserRoleEntity>(this);

  /**
   * One-time password codes for authentication.
   * One-to-many relationship - user can have multiple active OTPs.
   * Used for SMS/email verification and password reset.
   */
  @OneToMany(() => OtpEntity, (otp) => otp.user)
  otps = new Collection<OtpEntity>(this);

  /**
   * Active user sessions across different devices/browsers.
   * One-to-many relationship - user can be logged in on multiple devices.
   * Used for session management and security monitoring.
   */
  @OneToMany(() => SessionEntity, (session) => session.user)
  sessions = new Collection<SessionEntity>(this);

  /**
   * Trusted devices for this user account.
   * One-to-many relationship - user can have multiple trusted devices.
   * Used for device-based authentication and security policies.
   */
  @OneToMany(() => DeviceEntity, (device) => device.user)
  devices = new Collection<DeviceEntity>(this);

  /**
   * API access keys for programmatic access.
   * One-to-many relationship - user can have multiple API keys.
   * Used for third-party integrations and automated access.
   */
  @OneToMany(() => ApiKeyEntity, (apiKey) => apiKey.user)
  apiKeys = new Collection<ApiKeyEntity>(this);

  /**
   * Security audit trail for this user account.
   * One-to-many relationship - tracks all security-related events.
   * Used for compliance, monitoring, and incident response.
   */
  @OneToMany(() => SecurityEventEntity, (event) => event.user)
  securityEvents = new Collection<SecurityEventEntity>(this);

  // Optional: Revoked tokens are not used in the current implementation
  // @OneToMany(() => RevokedTokenEntity, (token) => token.user)
  // revokedTokens = new Collection<RevokedTokenEntity>(this);

  // Optional: Audit logs are not used in the current implementation
  // @OneToMany(() => AuditLogEntity, (log) => log.user)
  // auditLogs = new Collection<AuditLogEntity>(this);
}
