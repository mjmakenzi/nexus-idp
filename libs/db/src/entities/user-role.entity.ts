import {
  Entity,
  EntityRepositoryType,
  ManyToOne,
  OptionalProps,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { RoleEntity } from './role.entity';
import { UserEntity } from './user.entity';

/**
 * UserRoleEntity - Manages user-role assignments and role-based access control
 *
 * This entity represents the many-to-many relationship between users and roles
 * in the identity provider system. It tracks role assignments, including when
 * roles were granted, who granted them, and when they expire.
 *
 * Key responsibilities:
 * - Link users to their assigned roles
 * - Track role assignment lifecycle (granting, expiration)
 * - Maintain audit trail of role changes
 * - Support temporary role assignments with expiration
 * - Enable role-based access control (RBAC) implementation
 *
 * Security considerations:
 * - Role assignments can have expiration dates
 * - Audit trail tracks who granted roles and why
 * - Supports temporary elevated permissions
 * - Enables fine-grained access control policies
 *
 * Business logic:
 * - Users can have multiple roles simultaneously
 * - Roles can be granted temporarily or permanently
 * - Role assignments are auditable for compliance
 * - Supports role delegation and administrative functions
 */
@Entity({ tableName: 'user_roles', repository: () => UserRoleRepository })
export class UserRoleEntity {
  [EntityRepositoryType]?: UserRoleRepository;

  /**
   * Fields that are optional during entity creation or updates
   * These fields can be null/undefined and don't require explicit values
   */
  [OptionalProps]?: 'expiresAt' | 'grantedBy' | 'grantReason';

  /**
   * Unique identifier for the user-role assignment record
   * Auto-generated primary key for database operations
   * Each record represents a single role assignment to a user
   */
  @PrimaryKey()
  id!: number;

  /**
   * The user who is assigned this role
   * Required relationship - every role assignment must belong to a user
   * Used for user authentication and authorization decisions
   * Links to UserEntity for user information and validation
   */
  @ManyToOne(() => UserEntity)
  user!: UserEntity;

  /**
   * The role being assigned to the user
   * Required relationship - every assignment must reference a valid role
   * Used for permission checking and access control decisions
   * Links to RoleEntity for role definition and permissions
   */
  @ManyToOne(() => RoleEntity)
  role!: RoleEntity;

  /**
   * Timestamp when this role was granted to the user
   * Automatically set when the role assignment is created
   * Used for audit trail and role assignment history
   * Required field - all role assignments must have a grant timestamp
   */
  @Property({ name: 'granted_at' })
  grantedAt!: Date;

  /**
   * Timestamp when this role assignment expires (optional)
   * Nullable because some role assignments are permanent
   * Used for temporary role assignments and automatic cleanup
   * When null, the role assignment is considered permanent
   * Used for time-limited elevated permissions and temporary access
   */
  @Property({ name: 'expires_at', nullable: true })
  expiresAt?: Date;

  /**
   * Identifier of the user or system that granted this role (optional)
   * Can be user ID, username, or system identifier
   * Nullable because some role assignments may be system-generated
   * Used for audit trail and accountability tracking
   * Examples: 'admin_user_123', 'system_auto_assignment', 'user_self_registration'
   */
  @Property({ name: 'granted_by', nullable: true })
  grantedBy?: string;

  /**
   * Reason or justification for granting this role (optional)
   * Human-readable description of why the role was assigned
   * Nullable because some role assignments may not require justification
   * Used for compliance reporting and administrative review
   * Examples: 'Temporary admin access for system maintenance', 'User requested elevated permissions', 'Automatic assignment based on department'
   */
  @Property({ name: 'grant_reason', nullable: true })
  grantReason?: string;
}
