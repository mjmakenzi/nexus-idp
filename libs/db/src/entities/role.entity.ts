import {
  BaseEntity,
  Collection,
  Entity,
  EntityRepositoryType,
  OneToMany,
  OptionalProps,
  PrimaryKey,
  Property,
  Unique,
} from '@mikro-orm/core';
import { RoleRepository } from '../repositories/role.repository';
import { UserRoleEntity } from './user-role.entity';

/**
 * Role entity for defining user roles and permissions in the system.
 *
 * This entity handles:
 * - Role definitions and hierarchical permissions
 * - Permission-based access control (RBAC)
 * - System and default role management
 * - Role assignment to users
 * - Role lifecycle and audit trail
 * - Flexible permission storage and management
 */
@Entity({ tableName: 'roles', repository: () => RoleRepository })
export class RoleEntity extends BaseEntity {
  [EntityRepositoryType]?: RoleRepository;

  /**
   * Optional properties that can be undefined during entity creation/updates.
   * These fields have default values and may not be set initially.
   */
  [OptionalProps]?:
    | 'description' // Role description (nullable)
    | 'isDefault' // Whether this is a default role (defaults to false)
    | 'isSystem'; // Whether this is a system role (defaults to false)

  /** Unique identifier for the role record */
  @PrimaryKey()
  id!: number;

  /**
   * Human-readable name for the role (e.g., "Administrator", "User", "Moderator").
   * Used for display purposes and user interface.
   */
  @Property({ fieldName: 'name', serializedName: 'name' })
  name!: string;

  /**
   * Unique code identifier for the role (e.g., "ADMIN", "USER", "MODERATOR").
   * Used for programmatic role checks and API operations.
   * Must be unique across all roles.
   */
  @Property({ fieldName: 'code', serializedName: 'code' })
  @Unique()
  code!: string;

  /**
   * Detailed description of the role's purpose and responsibilities.
   * Used for role management and documentation.
   */
  @Property({
    fieldName: 'description',
    serializedName: 'description',
    nullable: true,
  })
  description?: string;

  /**
   * Array of permission strings granted to this role.
   * Stored as JSON for flexible permission management.
   * Examples: ["user:read", "user:write", "admin:all"]
   */
  @Property({
    fieldName: 'permissions',
    serializedName: 'permissions',
    type: 'json',
  })
  permissions!: string[];

  /**
   * Whether this role is assigned by default to new users.
   * Default roles are automatically assigned during user registration.
   * Used for standard user onboarding and role management.
   */
  @Property({
    fieldName: 'is_default',
    serializedName: 'is_default',
    default: false,
  })
  isDefault: boolean = false;

  /**
   * Whether this is a system role that cannot be modified or deleted.
   * System roles are essential for system operation and security.
   * Used to protect critical roles from accidental modification.
   */
  @Property({
    fieldName: 'is_system',
    serializedName: 'is_system',
    default: false,
  })
  isSystem: boolean = false;

  /**
   * Timestamp when the role was created.
   * Automatically set on entity creation.
   */
  @Property({
    fieldName: 'created_at',
    serializedName: 'created_at',
    onCreate: () => new Date(),
  })
  createdAt: Date = new Date();

  /**
   * Timestamp when the role was last updated.
   * Automatically updated on any entity modification.
   */
  @Property({
    fieldName: 'updated_at',
    serializedName: 'updated_at',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  // ========================================
  // RELATIONSHIPS
  // ========================================

  /**
   * User-role assignments for this role.
   * One-to-many relationship - one role can be assigned to multiple users.
   * Used for role assignment tracking and user management.
   */
  @OneToMany(() => UserRoleEntity, (userRole) => userRole.role)
  userRoles = new Collection<UserRoleEntity>(this);
}
