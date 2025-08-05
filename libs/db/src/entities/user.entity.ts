import {
  BaseEntity,
  Cascade,
  Collection,
  Entity,
  EntityRepositoryType,
  Enum,
  Index,
  OneToMany,
  OneToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { UserRepository } from '../repositories/user.repository';
import { ApiKeyEntity } from './api-key.entity';
import { AuditLogEntity } from './audit-log.entity';
import { DeviceEntity } from './device.entity';
import { FederatedIdentityEntity } from './federated-identity.entity';
import { OtpEntity } from './otp.entity';
import { ProfileEntity } from './profile.entity';
import { RevokedTokenEntity } from './revoked-token.entity';
import { SecurityEventEntity } from './security-event.entity';
import { SessionEntity } from './session.entity';
import { UserRoleEntity } from './user-role.entity';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted',
}

/**
 * User entity representing a user account in the identity provider system.
 *
 * This entity is designed for high-performance identity management with the following
 * efficiency categories and use cases:
 *
 * ========================================
 * EFFICIENCY CATEGORIES
 * ========================================
 *
 * 1. CRITICAL PERFORMANCE FIELDS (Indexed)
 *    - Used in high-frequency authentication and lookup operations
 *    - Optimized with database indexes for sub-millisecond response times
 *    - Fields: username, email_normalized, phone, status, last_login_at, deleted_at
 *
 * 2. AUTHENTICATION FIELDS (Frequently Accessed)
 *    - Used in every login/authentication attempt
 *    - Includes password verification, MFA, and session management
 *    - Fields: password_hash, password_salt, totp_secret, mfa_enabled, mfa_method
 *
 * 3. VERIFICATION FIELDS (Moderate Frequency)
 *    - Used during account setup and periodic verification
 *    - Includes email/phone verification and identity validation
 *    - Fields: email_verified_at, phone_verified_at, identity_verified_at
 *
 * 4. SECURITY MONITORING FIELDS (Low Frequency, High Impact)
 *    - Used for security analysis, threat detection, and compliance
 *    - Includes login attempts, locks, and security events
 *    - Fields: failed_login_attempts, locked_until, last_login_ip
 *
 * 5. COMPLIANCE FIELDS (Audit Requirements)
 *    - Used for legal compliance and audit trails
 *    - Includes terms acceptance, privacy consent, and audit timestamps
 *    - Fields: terms_accepted_at, privacy_accepted_at, created_at, updated_at
 *
 * 6. RELATIONSHIP FIELDS (Data Integrity)
 *    - Used for maintaining referential integrity and data relationships
 *    - Includes foreign keys and relationship collections
 *    - Fields: All @OneToMany and @OneToOne relationships
 *
 * ========================================
 * USE CASES BY CATEGORY
 * ========================================
 *
 * CRITICAL PERFORMANCE USE CASES:
 * - User authentication (username/email/phone lookup)
 * - Account status verification (active/suspended checks)
 * - Soft delete filtering (exclude deleted users)
 * - User activity analysis (last login queries)
 *
 * AUTHENTICATION USE CASES:
 * - Password verification during login
 * - Multi-factor authentication (TOTP, backup codes)
 * - Session management and device tracking
 * - Password change tracking and versioning
 *
 * VERIFICATION USE CASES:
 * - Email verification workflow
 * - Phone number verification (SMS OTP)
 * - Identity verification (KYC processes)
 * - Account activation and setup completion
 *
 * SECURITY MONITORING USE CASES:
 * - Brute force attack detection
 * - Account lockout management
 * - Security event correlation
 * - IP-based security policies
 *
 * COMPLIANCE USE CASES:
 * - GDPR compliance (privacy consent tracking)
 * - Terms of service acceptance
 * - Audit trail maintenance
 * - Data retention policies
 *
 * RELATIONSHIP USE CASES:
 * - Role-based access control (RBAC)
 * - OAuth/SSO integration
 * - Device management and trust
 * - API key management
 * - Security event logging
 *
 * ========================================
 * PERFORMANCE OPTIMIZATIONS
 * ========================================
 *
 * Database Indexes:
 * - idx_email_normalized: Fast email-based lookups
 * - idx_phone: Fast phone-based authentication
 * - idx_status: Efficient status filtering
 * - idx_last_login: User activity queries
 * - idx_deleted_at: Soft delete filtering
 *
 * Unique Constraints:
 * - username: Prevents duplicate usernames
 * - email_normalized: Prevents duplicate emails (case-insensitive)
 * - phone: Prevents duplicate phone numbers
 *
 * Default Values:
 * - status: 'pending' for new accounts
 * - mfa_enabled: false for new accounts
 * - failed_login_attempts: 0 for new accounts
 * - password_version: 1 for new accounts
 *
 * ========================================
 * SECURITY CONSIDERATIONS
 * ========================================
 *
 * Password Security:
 * - password_hash: Bcrypt/Argon2 hashed passwords
 * - password_salt: Unique salt per user
 * - password_version: Tracks password changes for session invalidation
 *
 * Multi-Factor Authentication:
 * - totp_secret: Time-based one-time password secret
 * - backup_codes: JSON array of backup codes
 * - mfa_enabled: Boolean flag for MFA status
 * - mfa_method: Type of MFA (totp, sms, email)
 *
 * Account Security:
 * - failed_login_attempts: Tracks failed attempts
 * - locked_until: Temporary account lockouts
 * - last_login_ip: IP tracking for security analysis
 *
 * ========================================
 * RELATIONSHIPS OVERVIEW
 * ========================================
 *
 * Core Relationships:
 * - profile: One-to-one with ProfileEntity (extended user data)
 * - federatedIdentities: One-to-many with FederatedIdentityEntity (OAuth/SSO)
 * - userRoles: One-to-many with UserRoleEntity (RBAC)
 * - sessions: One-to-many with SessionEntity (active sessions)
 * - devices: One-to-many with DeviceEntity (trusted devices)
 * - apiKeys: One-to-many with ApiKeyEntity (API access)
 * - securityEvents: One-to-many with SecurityEventEntity (audit trail)
 *
 * Relationship Purposes:
 * - profile: Stores non-critical user data (name, avatar, preferences) - CASCADE DELETE
 * - federatedIdentities: Enables OAuth/SSO login methods
 * - userRoles: Implements role-based access control - CASCADE DELETE
 * - sessions: Manages user login sessions across devices - CASCADE DELETE
 * - devices: Tracks and manages trusted devices - CASCADE DELETE
 * - otps: One-time password codes for authentication - CASCADE DELETE
 * - apiKeys: Provides programmatic access to the system - CASCADE DELETE
 * - securityEvents: Maintains security audit trail - SET NULL ON DELETE
 * - revokedTokens: Token blacklisting and security audit - SET NULL ON DELETE
 * - auditLogs: Activity tracking and compliance audit - SET NULL ON DELETE
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
    | 'emailVerifiedAt' // Email verification timestamp
    | 'phoneVerifiedAt' // Phone verification timestamp
    | 'failedLoginAttempts' // Count of failed login attempts
    | 'lockedUntil' // Account lock expiration timestamp
    | 'lastLoginAt' // Last successful login timestamp
    | 'lastLoginIp' // IP address of last login
    | 'status'; // Account status (active, suspended, etc.)

  /** Unique identifier for the user account */
  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: bigint;

  @Property({
    fieldName: 'username',
    serializedName: 'username',
    type: 'varchar',
    length: 50,
    unique: true,
  })
  username!: string;

  @Property({
    fieldName: 'email_normalized',
    serializedName: 'email_normalized',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  @Index({ name: 'idx_email_normalized' })
  emailNormalized?: string;

  @Property({
    fieldName: 'email',
    serializedName: 'email',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  email?: string;

  @Property({
    fieldName: 'phone',
    serializedName: 'phone',
    nullable: true,
    type: 'varchar',
    length: 20,
  })
  @Index({ name: 'idx_phone' })
  phone?: string;

  @Property({
    fieldName: 'phone_number',
    serializedName: 'phone_number',
    nullable: true,
    type: 'varchar',
    length: 20,
  })
  phoneNumber?: string;

  @Property({
    fieldName: 'country_code',
    serializedName: 'country_code',
    nullable: true,
    type: 'char',
    length: 2,
  })
  countryCode?: string;

  @Property({
    fieldName: 'external_id',
    serializedName: 'external_id',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  externalId?: string;

  @Property({
    fieldName: 'password_hash',
    serializedName: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  passwordHash!: string;

  @Property({
    fieldName: 'password_salt',
    serializedName: 'password_salt',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  passwordSalt!: string;

  @Property({
    fieldName: 'password_changed_at',
    serializedName: 'password_changed_at',
    nullable: true,
    type: 'timestamp',
  })
  passwordChangedAt?: Date;

  @Property({
    fieldName: 'password_version',
    serializedName: 'password_version',
    default: 1,
    type: 'int',
    nullable: false,
  })
  passwordVersion!: number;

  @Property({
    fieldName: 'totp_secret',
    serializedName: 'totp_secret',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  totpSecret?: string;

  @Property({
    fieldName: 'backup_codes',
    serializedName: 'backup_codes',
    type: 'json',
    nullable: true,
  })
  backupCodes?: string[];

  @Property({
    fieldName: 'mfa_enabled',
    serializedName: 'mfa_enabled',
    default: false,
    type: 'boolean',
    nullable: false,
  })
  mfaEnabled: boolean = false;

  @Property({
    fieldName: 'mfa_method',
    serializedName: 'mfa_method',
    nullable: true,
    type: 'varchar',
    length: 20,
  })
  mfaMethod?: string;

  @Property({
    fieldName: 'email_verified_at',
    serializedName: 'email_verified_at',
    nullable: true,
    type: 'timestamp',
  })
  emailVerifiedAt?: Date;

  @Property({
    fieldName: 'phone_verified_at',
    serializedName: 'phone_verified_at',
    nullable: true,
    type: 'datetime',
  })
  phoneVerifiedAt?: Date;

  @Property({
    fieldName: 'identity_verified_at',
    serializedName: 'identity_verified_at',
    nullable: true,
    type: 'datetime',
  })
  identityVerifiedAt?: Date;

  @Property({
    fieldName: 'failed_login_attempts',
    serializedName: 'failed_login_attempts',
    default: 0,
    type: 'int',
    nullable: false,
  })
  failedLoginAttempts: number = 0;

  @Property({
    fieldName: 'locked_until',
    serializedName: 'locked_until',
    nullable: true,
    type: 'datetime',
  })
  lockedUntil?: Date;

  @Property({
    fieldName: 'last_login_at',
    serializedName: 'last_login_at',
    nullable: true,
    type: 'datetime',
  })
  @Index({ name: 'idx_last_login' })
  lastLoginAt?: Date;

  @Property({
    fieldName: 'last_login_ip',
    serializedName: 'last_login_ip',
    nullable: true,
    type: 'varchar',
    length: 45,
  })
  @Index({ name: 'idx_last_login_ip' })
  lastLoginIp?: string;

  @Property({
    fieldName: 'status',
    serializedName: 'status',
    type: 'varchar',
    length: 20,
    default: UserStatus.PENDING,
  })
  @Enum(() => UserStatus)
  @Index({ name: 'idx_status' })
  status: UserStatus = UserStatus.PENDING;

  @Property({
    fieldName: 'terms_accepted_at',
    serializedName: 'terms_accepted_at',
    nullable: true,
    type: 'datetime',
  })
  termsAcceptedAt?: Date;

  @Property({
    fieldName: 'terms_version',
    serializedName: 'terms_version',
    nullable: true,
    type: 'varchar',
    length: 20,
  })
  termsVersion?: string;

  @Property({
    fieldName: 'privacy_accepted_at',
    nullable: true,
    type: 'timestamp',
  })
  privacyAcceptedAt?: Date;

  @Property({
    fieldName: 'privacy_version',
    serializedName: 'privacy_version',
    nullable: true,
    type: 'varchar',
    length: 20,
  })
  privacyVersion?: string;

  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    type: 'datetime',
    nullable: false,
  })
  createdAt!: Date;

  @Property({
    fieldName: 'updated_at',
    serializedName: 'updated_at',
    type: 'timestamp',
    nullable: false,
  })
  updatedAt?: Date;

  @Property({
    fieldName: 'deleted_at',
    serializedName: 'deleted_at',
    nullable: true,
    type: 'timestamp',
  })
  @Index({ name: 'idx_deleted_at' })
  deletedAt?: Date;

  @Property({
    fieldName: 'created_by',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  createdBy?: string;

  @Property({
    fieldName: 'updated_by',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  updatedBy?: string;

  // ========================================
  // RELATIONSHIPS
  // ========================================

  /**
   * Extended user profile information (name, avatar, preferences, etc.).
   * One-to-one relationship - each user has at most one profile.
   * Cascade delete: When user is deleted, profile is automatically deleted.
   */
  @OneToOne(() => ProfileEntity, (profile) => profile.user, {
    nullable: true,
    cascade: [Cascade.REMOVE],
  })
  profile?: ProfileEntity;

  /**
   * OAuth/SSO identities linked to this user account.
   * One-to-many relationship - user can have multiple OAuth providers.
   * Examples: Google, Apple, Facebook, GitHub, etc.
   */
  @OneToMany(() => FederatedIdentityEntity, (identity) => identity.user, {
    cascade: [Cascade.REMOVE],
  })
  federatedIdentities = new Collection<FederatedIdentityEntity>(this);

  /**
   * User's assigned roles and permissions.
   * One-to-many relationship - user can have multiple roles.
   * Used for authorization and access control.
   * Cascade delete: When user is deleted, all role assignments are automatically deleted.
   */
  @OneToMany(() => UserRoleEntity, (userRole) => userRole.user, {
    cascade: [Cascade.REMOVE],
  })
  userRoles = new Collection<UserRoleEntity>(this);

  /**
   * One-time password codes for authentication.
   * One-to-many relationship - user can have multiple active OTPs.
   * Used for SMS/email verification and password reset.
   * Cascade delete: When user is deleted, all OTPs are automatically deleted.
   */
  @OneToMany(() => OtpEntity, (otp) => otp.user, {
    cascade: [Cascade.REMOVE],
  })
  otps = new Collection<OtpEntity>(this);

  /**
   * Active user sessions across different devices/browsers.
   * One-to-many relationship - user can be logged in on multiple devices.
   * Used for session management and security monitoring.
   * Cascade delete: When user is deleted, all sessions are automatically deleted.
   */
  @OneToMany(() => SessionEntity, (session) => session.user, {
    cascade: [Cascade.REMOVE],
  })
  sessions = new Collection<SessionEntity>(this);

  /**
   * Trusted devices for this user account.
   * One-to-many relationship - user can have multiple trusted devices.
   * Used for device-based authentication and security policies.
   * Cascade delete: When user is deleted, all devices are automatically deleted.
   */
  @OneToMany(() => DeviceEntity, (device) => device.user, {
    cascade: [Cascade.REMOVE],
  })
  devices = new Collection<DeviceEntity>(this);

  /**
   * API access keys for programmatic access.
   * One-to-many relationship - user can have multiple API keys.
   * Used for third-party integrations and automated access.
   * Cascade delete: When user is deleted, all API keys are automatically deleted.
   */
  @OneToMany(() => ApiKeyEntity, (apiKey) => apiKey.user, {
    cascade: [Cascade.REMOVE],
  })
  apiKeys = new Collection<ApiKeyEntity>(this);

  /**
   * Security audit trail for this user account.
   * One-to-many relationship - tracks all security-related events.
   * Used for compliance, monitoring, and incident response.
   * Set null on delete: When user is deleted, security events remain for audit purposes.
   */
  @OneToMany(() => SecurityEventEntity, (event) => event.user, {
    cascade: [Cascade.PERSIST],
  })
  securityEvents = new Collection<SecurityEventEntity>(this);

  /**
   * Revoked authentication tokens for this user account.
   * One-to-many relationship - user can have multiple revoked tokens.
   * Used for token blacklisting and security audit trails.
   * Set null on delete: When user is deleted, revoked tokens remain for audit purposes.
   */
  @OneToMany(() => RevokedTokenEntity, (token) => token.user, {
    cascade: [Cascade.PERSIST],
  })
  revokedTokens = new Collection<RevokedTokenEntity>(this);

  /**
   * Audit log entries for this user account.
   * One-to-many relationship - user can have multiple audit log entries.
   * Used for activity tracking and compliance audit trails.
   * Set null on delete: When user is deleted, audit logs remain for compliance purposes.
   */
  @OneToMany(() => AuditLogEntity, (log) => log.user, {
    cascade: [Cascade.PERSIST],
  })
  auditLogs = new Collection<AuditLogEntity>(this);
}
