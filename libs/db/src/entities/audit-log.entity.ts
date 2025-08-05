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
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { UserEntity } from './user.entity';

export enum ActorType {
  USER = 'user',
  SYSTEM = 'system',
  ADMIN = 'admin',
  API = 'api',
}

export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
}

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
  @PrimaryKey({ type: 'bigint', autoincrement: true })
  id!: bigint;

  /**
   * User who performed the action (actor).
   * Many-to-one relationship - tracks who is responsible for the action.
   * Used for accountability and user activity tracking.
   * Set null on delete: When user is deleted, user_id becomes null but audit log remains.
   */
  @ManyToOne({
    fieldName: 'user_id',
    entity: () => UserEntity,
    nullable: true,
  })
  @Index({ name: 'idx_user_performed', properties: ['user', 'performedAt'] })
  user?: UserEntity;

  /**
   * Target user affected by the action (if applicable).
   * Many-to-one relationship - used when actions affect other users.
   * Examples: admin modifying user account, user blocking another user.
   * Set null on delete: When target user is deleted, target_user_id becomes null but audit log remains.
   */
  @ManyToOne(() => UserEntity, { fieldName: 'target_user_id', nullable: true })
  targetUser?: UserEntity;

  /**
   * Type of actor who performed the action (user, system, admin, api).
   * Used to categorize the source of the action for analysis and filtering.
   */
  @Property({
    fieldName: 'actor_type',
    serializedName: 'actor_type',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  @Enum(() => ActorType)
  actorType!: ActorType; // user/system/admin/api

  /**
   * Action performed (create, update, delete, login, logout, etc.).
   * Describes what operation was executed on the resource.
   */
  @Property({
    fieldName: 'action',
    serializedName: 'action',
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  @Enum(() => ActionType)
  action!: ActionType; // create/update/delete

  /**
   * Type of resource that was affected (User, Role, Device, etc.).
   * Used to categorize what entity was modified or accessed.
   */
  @Property({
    fieldName: 'resource_type',
    serializedName: 'resource_type',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  @Index({ name: 'idx_resource', properties: ['resourceType', 'resourceId'] })
  resourceType!: string; // e.g. User, Role, Device

  /**
   * Unique identifier of the specific resource that was affected.
   * Used to link the audit log to the specific entity that was modified.
   */
  @Property({
    fieldName: 'resource_id',
    serializedName: 'resource_id',
    type: 'varchar',
    length: 100,
    nullable: false,
  })
  resourceId!: string;

  /**
   * Previous values of the resource before the change (JSON format).
   * Stored as JSON for flexible field tracking.
   * Used for change tracking and rollback capabilities.
   */
  @Property({
    fieldName: 'old_values',
    serializedName: 'old_values',
    type: 'json',
    nullable: true,
  })
  oldValues?: Record<string, unknown>;

  /**
   * New values of the resource after the change (JSON format).
   * Stored as JSON for flexible field tracking.
   * Used for change tracking and understanding what was modified.
   */
  @Property({
    fieldName: 'new_values',
    serializedName: 'new_values',
    type: 'json',
    nullable: true,
  })
  newValues?: Record<string, unknown>;

  /**
   * IP address of the actor who performed the action.
   * Used for security monitoring, geolocation tracking, and fraud detection.
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
   * User agent string from the browser/client that performed the action.
   * Used for security monitoring and client identification.
   */
  @Property({
    fieldName: 'user_agent',
    serializedName: 'user_agent',
    nullable: true,
    type: 'text',
  })
  userAgent?: string;

  /**
   * Additional context data stored as JSON.
   * Flexible storage for session info, request details, error messages, etc.
   */
  @Property({
    fieldName: 'metadata',
    serializedName: 'metadata',
    type: 'json',
    nullable: true,
  })
  metadata?: Record<string, unknown>;

  /**
   * Timestamp when the action was performed.
   * Used for chronological ordering and time-based analysis.
   */
  @Property({
    fieldName: 'performed_at',
    serializedName: 'performed_at',
    type: 'timestamp',
    nullable: false,
  })
  @Index({ name: 'idx_performed_at' })
  performedAt: Date = new Date();
}
