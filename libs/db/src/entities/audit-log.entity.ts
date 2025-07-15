import {
  BaseEntity,
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { UserEntity } from './user.entity';

/**
 * Audit log entity for tracking all system activities and changes.
 *
 * This entity handles:
 * - Complete audit trail of all system actions
 * - User activity tracking and accountability
 * - Change tracking with before/after values
 * - Security incident monitoring and investigation
 * - Compliance and regulatory requirements
 * - System and API activity logging
 */
@Entity({ tableName: 'audit_logs', repository: () => AuditLogRepository })
export class AuditLogEntity extends BaseEntity {
  [EntityRepositoryType]?: AuditLogRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields are nullable or may not be set initially.
   */
  [OptionalProps]?:
    | 'targetUser' // Target user for the action (nullable)
    | 'oldValues' // Previous values before change (nullable)
    | 'newValues' // New values after change (nullable)
    | 'ipAddress' // IP address of the actor (nullable)
    | 'userAgent' // User agent string (nullable)
    | 'metadata'; // Additional context data (nullable)

  /** Unique identifier for the audit log record */
  @PrimaryKey()
  id!: number;

  /**
   * User who performed the action (actor).
   * Many-to-one relationship - tracks who is responsible for the action.
   * Used for accountability and user activity tracking.
   */
  @ManyToOne({ name: 'user_id' })
  user!: UserEntity;

  /**
   * Target user affected by the action (if applicable).
   * Many-to-one relationship - used when actions affect other users.
   * Examples: admin modifying user account, user blocking another user.
   */
  @ManyToOne(() => UserEntity, { nullable: true })
  targetUser?: UserEntity;

  /**
   * Type of actor who performed the action (user, system, admin, api).
   * Used to categorize the source of the action for analysis and filtering.
   */
  @Property({ name: 'actor_type' })
  actorType!: string; // user/system/admin/api

  /**
   * Action performed (create, update, delete, login, logout, etc.).
   * Describes what operation was executed on the resource.
   */
  @Property()
  action!: string; // create/update/delete

  /**
   * Type of resource that was affected (User, Role, Device, etc.).
   * Used to categorize what entity was modified or accessed.
   */
  @Property({ name: 'resource_type' })
  resourceType!: string; // e.g. User, Role, Device

  /**
   * Unique identifier of the specific resource that was affected.
   * Used to link the audit log to the specific entity that was modified.
   */
  @Property({ name: 'resource_id' })
  resourceId!: string;

  /**
   * Previous values of the resource before the change (JSON format).
   * Stored as JSON for flexible field tracking.
   * Used for change tracking and rollback capabilities.
   */
  @Property({ name: 'old_values', type: 'json', nullable: true })
  oldValues?: Record<string, unknown>;

  /**
   * New values of the resource after the change (JSON format).
   * Stored as JSON for flexible field tracking.
   * Used for change tracking and understanding what was modified.
   */
  @Property({ name: 'new_values', type: 'json', nullable: true })
  newValues?: Record<string, unknown>;

  /**
   * IP address of the actor who performed the action.
   * Used for security monitoring, geolocation tracking, and fraud detection.
   */
  @Property({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  /**
   * User agent string from the browser/client that performed the action.
   * Used for security monitoring and client identification.
   */
  @Property({ name: 'user_agent', nullable: true })
  userAgent?: string;

  /**
   * Additional context data stored as JSON.
   * Flexible storage for session info, request details, error messages, etc.
   */
  @Property({ type: 'json', nullable: true })
  metadata?: Record<string, unknown>;

  /**
   * Timestamp when the action was performed.
   * Used for chronological ordering and time-based analysis.
   */
  @Property({ name: 'performed_at' })
  performedAt!: Date;

  /**
   * Timestamp when the audit log record was created.
   * Used for audit trail management and record lifecycle tracking.
   */
  @Property({ fieldName: 'created_on' })
  createdOn!: Date;
}
