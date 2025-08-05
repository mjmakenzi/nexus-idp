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
import { SecurityEventRepository } from '../repositories/security-event.repository';
import { UserEntity } from './user.entity';

export enum Severity {
  INFO = 'info',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security event entity for tracking and monitoring security-related activities.
 *
 * This entity handles:
 * - Security incident tracking and monitoring
 * - Risk assessment and scoring
 * - Geographic location tracking for security analysis
 * - Event categorization and severity classification
 * - Incident response and resolution tracking
 * - Security audit trail and compliance reporting
 */
@Entity({
  tableName: 'security_events',
  repository: () => SecurityEventRepository,
})
export class SecurityEventEntity extends BaseEntity {
  [EntityRepositoryType]?: SecurityEventRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields are nullable or may not be set initially.
   */
  [OptionalProps]?:
    | 'user' // Associated user account (nullable)
    | 'riskScore' // Risk assessment score (nullable)
    | 'eventData' // Additional event context data (nullable)
    | 'ipAddress' // IP address of the event (nullable)
    | 'geoLocation' // Geographic location data (nullable)
    | 'userAgent' // User agent string (nullable)
    | 'sessionId' // Session identifier (nullable)
    | 'requiresAction' // Whether action is required (defaults to false)
    | 'isResolved' // Whether event is resolved (defaults to false)
    | 'resolvedBy' // Who resolved the event (nullable)
    | 'resolvedAt'; // When event was resolved (nullable)

  /** Unique identifier for the security event record */
  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: bigint;

  /**
   * Associated user account involved in the security event.
   * Many-to-one relationship - nullable for system-wide events.
   * Used for user-specific security monitoring and incident response.
   * Set null on delete: When user is deleted, user_id becomes null but event remains for audit.
   */
  @ManyToOne(() => UserEntity, { fieldName: 'user_id', nullable: true })
  @Index({ name: 'idx_user_occurred', properties: ['user', 'occurredAt'] })
  user?: UserEntity;

  /**
   * Specific type of security event (login, logout, password_change, etc.).
   * Used for event categorization and automated response triggers.
   */
  @Property({
    fieldName: 'event_type',
    serializedName: 'event_type',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  eventType!: string; // e.g. login/logout/password_change

  /**
   * Category of the security event (auth, account, security, etc.).
   * Used for event grouping, filtering, and reporting.
   */
  @Property({
    fieldName: 'event_category',
    serializedName: 'event_category',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  eventCategory!: string; // e.g. auth/account/security

  /**
   * Severity level of the security event (info, low, medium, high, critical).
   * Used for prioritization, alerting, and response planning.
   */
  @Property({
    fieldName: 'severity',
    serializedName: 'severity',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  @Enum(() => Severity)
  @Index({
    name: 'idx_severity_unresolved',
    properties: ['severity', 'isResolved'],
  })
  severity!: Severity; // e.g. info/low/medium/high/critical

  /**
   * Risk assessment score for the security event.
   * Used for automated risk analysis and threat detection.
   */
  @Property({
    fieldName: 'risk_score',
    serializedName: 'risk_score',
    type: 'tinyint',
    nullable: true,
    unsigned: true,
  })
  @Index({ name: 'idx_risk_score' })
  riskScore?: number;

  /**
   * Additional context data for the security event stored as JSON.
   * Flexible storage for event-specific details, error messages, etc.
   * Examples: failed login attempts, suspicious patterns, device info.
   */
  @Property({
    fieldName: 'event_data',
    serializedName: 'event_data',
    type: 'json',
    nullable: true,
  })
  eventData?: Record<string, unknown>;

  /**
   * IP address associated with the security event.
   * Used for geolocation tracking, threat intelligence, and fraud detection.
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
   * Geographic location data derived from the IP address.
   * Stored as JSON with country, city, coordinates, etc.
   * Used for location-based security analysis and threat detection.
   */
  @Property({
    fieldName: 'geo_location',
    serializedName: 'geo_location',
    type: 'json',
    nullable: true,
  })
  geoLocation?: Record<string, unknown>;

  /**
   * User agent string from the browser/client involved in the event.
   * Used for client identification and security monitoring.
   */
  @Property({
    fieldName: 'user_agent',
    serializedName: 'user_agent',
    nullable: true,
    type: 'text',
  })
  userAgent?: string;

  /**
   * Session identifier associated with the security event.
   * Used for session tracking and correlation with other events.
   */
  @Property({
    fieldName: 'session_id',
    serializedName: 'session_id',
    nullable: true,
    type: 'varchar',
    length: 36,
  })
  sessionId?: string;

  /**
   * Timestamp when the security event occurred.
   * Used for chronological ordering and time-based analysis.
   */
  @Property({
    fieldName: 'occurred_at',
    serializedName: 'occurred_at',
    type: 'timestamp',
    nullable: false,
  })
  occurredAt: Date = new Date();

  /**
   * Whether this security event requires manual action or investigation.
   * Used for alerting, ticket creation, and workflow management.
   */
  @Property({
    fieldName: 'requires_action',
    serializedName: 'requires_action',
    default: false,
    type: 'boolean',
    nullable: false,
  })
  requiresAction: boolean = false;

  /**
   * Whether this security event has been resolved or addressed.
   * Used for incident tracking and resolution management.
   */
  @Property({
    fieldName: 'is_resolved',
    serializedName: 'is_resolved',
    default: false,
    type: 'boolean',
    nullable: false,
  })
  isResolved: boolean = false;

  /**
   * Identifier of who resolved the security event (user ID, admin ID, system).
   * Used for accountability and audit trail in incident response.
   */
  @Property({
    fieldName: 'resolved_by',
    serializedName: 'resolved_by',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  resolvedBy?: string;

  /**
   * Timestamp when the security event was resolved.
   * Used for incident response metrics and resolution tracking.
   */
  @Property({
    fieldName: 'resolved_at',
    serializedName: 'resolved_at',
    nullable: true,
    type: 'timestamp',
  })
  resolvedAt?: Date;
}
