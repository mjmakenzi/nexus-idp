import { EntityRepository } from '@mikro-orm/postgresql';
import { RoleEntity } from '../entities/role.entity';

export class RoleRepository extends EntityRepository<RoleEntity> {
  /**
   * Find role by ID
   */
  async findById(id: number): Promise<RoleEntity | null> {
    return this.findOne({ id });
  }

  /**
   * Find role by code
   */
  async findByCode(code: string): Promise<RoleEntity | null> {
    return this.findOne({ code });
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<RoleEntity | null> {
    return this.findOne({ name });
  }

  /**
   * Find all default roles
   */
  async findDefaultRoles(): Promise<RoleEntity[]> {
    return this.find({ isDefault: true });
  }

  /**
   * Find all system roles
   */
  async findSystemRoles(): Promise<RoleEntity[]> {
    return this.find({ isSystem: true });
  }

  /**
   * Find all non-system roles
   */
  async findNonSystemRoles(): Promise<RoleEntity[]> {
    return this.find({ isSystem: false });
  }

  /**
   * Find roles by permission
   */
  async findByPermission(permission: string): Promise<RoleEntity[]> {
    return this.find({ permissions: { $like: `%${permission}%` } });
  }

  /**
   * Find roles that have any of the specified permissions
   */
  async findByPermissions(permissions: string[]): Promise<RoleEntity[]> {
    const conditions = permissions.map((permission) => ({
      permissions: { $like: `%${permission}%` },
    }));
    return this.find({ $or: conditions });
  }

  /**
   * Find roles that have all of the specified permissions
   */
  async findByAllPermissions(permissions: string[]): Promise<RoleEntity[]> {
    const conditions = permissions.map((permission) => ({
      permissions: { $like: `%${permission}%` },
    }));
    return this.find({ $and: conditions });
  }

  /**
   * Create a new role
   */
  async createRole(roleData: {
    name: string;
    code: string;
    description?: string;
    permissions: string[];
    isDefault?: boolean;
    isSystem?: boolean;
  }): Promise<RoleEntity> {
    const role = this.create({
      ...roleData,
      isDefault: roleData.isDefault ?? false,
      isSystem: roleData.isSystem ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await this.em.persistAndFlush(role);
    return role;
  }

  /**
   * Update role information
   */
  async updateRole(
    id: number,
    roleData: Partial<RoleEntity>,
  ): Promise<RoleEntity | null> {
    const role = await this.findOne({ id });
    if (!role) return null;

    // Prevent updating system roles
    if (role.isSystem && roleData.isSystem === false) {
      throw new Error('Cannot modify system roles');
    }

    this.assign(role, roleData);
    await this.em.flush();
    return role;
  }

  /**
   * Update role permissions
   */
  async updatePermissions(id: number, permissions: string[]): Promise<void> {
    const role = await this.findOne({ id });
    if (!role) return;

    if (role.isSystem) {
      throw new Error('Cannot modify permissions of system roles');
    }

    await this.nativeUpdate({ id }, { permissions: permissions });
  }

  /**
   * Add permission to role
   */
  async addPermission(id: number, permission: string): Promise<void> {
    const role = await this.findOne({ id });
    if (!role) return;

    if (role.isSystem) {
      throw new Error('Cannot modify permissions of system roles');
    }

    if (!role.permissions.includes(permission)) {
      const updatedPermissions = [...role.permissions, permission];
      await this.nativeUpdate({ id }, { permissions: updatedPermissions });
    }
  }

  /**
   * Remove permission from role
   */
  async removePermission(id: number, permission: string): Promise<void> {
    const role = await this.findOne({ id });
    if (!role) return;

    if (role.isSystem) {
      throw new Error('Cannot modify permissions of system roles');
    }

    const updatedPermissions = role.permissions.filter((p) => p !== permission);
    await this.nativeUpdate({ id }, { permissions: updatedPermissions });
  }

  /**
   * Check if role has a specific permission
   */
  async hasPermission(id: number, permission: string): Promise<boolean> {
    const role = await this.findOne({ id });
    return role?.permissions.includes(permission) || false;
  }

  /**
   * Check if role has any of the specified permissions
   */
  async hasAnyPermission(id: number, permissions: string[]): Promise<boolean> {
    const role = await this.findOne({ id });
    if (!role) return false;

    return permissions.some((permission) =>
      role.permissions.includes(permission),
    );
  }

  /**
   * Check if role has all of the specified permissions
   */
  async hasAllPermissions(id: number, permissions: string[]): Promise<boolean> {
    const role = await this.findOne({ id });
    if (!role) return false;

    return permissions.every((permission) =>
      role.permissions.includes(permission),
    );
  }

  /**
   * Mark role as default
   */
  async markAsDefault(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { isDefault: true });
  }

  /**
   * Mark role as non-default
   */
  async markAsNonDefault(id: number): Promise<void> {
    await this.nativeUpdate({ id }, { isDefault: false });
  }

  /**
   * Update role description
   */
  async updateDescription(id: number, description: string): Promise<void> {
    await this.nativeUpdate({ id }, { description: description });
  }

  /**
   * Delete role by ID
   */
  async deleteRole(id: number): Promise<boolean> {
    const role = await this.findOne({ id });
    if (!role) return false;

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    await this.em.removeAndFlush(role);
    return true;
  }

  /**
   * Delete role by code
   */
  async deleteByCode(code: string): Promise<boolean> {
    const role = await this.findOne({ code });
    if (!role) return false;

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    await this.em.removeAndFlush(role);
    return true;
  }

  /**
   * Delete all non-system roles
   */
  async deleteNonSystemRoles(): Promise<number> {
    const result = await this.nativeDelete({ isSystem: false });
    return result;
  }

  /**
   * Count all roles
   */
  async countRoles(): Promise<number> {
    return this.count({});
  }

  /**
   * Count default roles
   */
  async countDefaultRoles(): Promise<number> {
    return this.count({ isDefault: true });
  }

  /**
   * Count system roles
   */
  async countSystemRoles(): Promise<number> {
    return this.count({ isSystem: true });
  }

  /**
   * Count non-system roles
   */
  async countNonSystemRoles(): Promise<number> {
    return this.count({ isSystem: false });
  }

  /**
   * Count roles with a specific permission
   */
  async countByPermission(permission: string): Promise<number> {
    return this.count({ permissions: { $like: `%${permission}%` } });
  }

  /**
   * Get role statistics
   */
  async getRoleStats(): Promise<{
    total: number;
    default: number;
    system: number;
    nonSystem: number;
    byPermission: Record<string, number>;
  }> {
    const [total, defaultCount, systemCount, nonSystemCount] =
      await Promise.all([
        this.countRoles(),
        this.countDefaultRoles(),
        this.countSystemRoles(),
        this.countNonSystemRoles(),
      ]);

    // Get counts by permission (top 10 most common permissions)
    const permissionStats = await this.em.execute(`
      SELECT 
        jsonb_array_elements_text(permissions) as permission,
        COUNT(*) as count
      FROM roles
      GROUP BY permission
      ORDER BY count DESC
      LIMIT 10
    `);

    const byPermission: Record<string, number> = {};
    permissionStats.forEach((stat: any) => {
      byPermission[stat.permission] = parseInt(stat.count);
    });

    return {
      total,
      default: defaultCount,
      system: systemCount,
      nonSystem: nonSystemCount,
      byPermission,
    };
  }

  /**
   * Find roles by multiple criteria
   */
  async findByCriteria(criteria: {
    name?: string;
    code?: string;
    isDefault?: boolean;
    isSystem?: boolean;
    hasPermission?: string;
    hasAnyPermission?: string[];
    hasAllPermissions?: string[];
    createdAfter?: Date;
    createdBefore?: Date;
  }): Promise<RoleEntity[]> {
    const where: any = {};

    if (criteria.name) where.name = criteria.name;
    if (criteria.code) where.code = criteria.code;
    if (criteria.isDefault !== undefined) where.isDefault = criteria.isDefault;
    if (criteria.isSystem !== undefined) where.isSystem = criteria.isSystem;

    if (criteria.hasPermission) {
      where.permissions = { $like: `%${criteria.hasPermission}%` };
    }

    if (criteria.hasAnyPermission && criteria.hasAnyPermission.length > 0) {
      const conditions = criteria.hasAnyPermission.map((permission) => ({
        permissions: { $like: `%${permission}%` },
      }));
      where.$or = conditions;
    }

    if (criteria.hasAllPermissions && criteria.hasAllPermissions.length > 0) {
      const conditions = criteria.hasAllPermissions.map((permission) => ({
        permissions: { $like: `%${permission}%` },
      }));
      where.$and = conditions;
    }

    if (criteria.createdAfter || criteria.createdBefore) {
      where.createdAt = {};
      if (criteria.createdAfter) where.createdAt.$gte = criteria.createdAfter;
      if (criteria.createdBefore) where.createdAt.$lt = criteria.createdBefore;
    }

    return this.find(where);
  }

  /**
   * Bulk update roles
   */
  async bulkUpdate(
    criteria: any,
    updates: Partial<RoleEntity>,
  ): Promise<number> {
    // Prevent bulk updates on system roles
    if (updates.isSystem === false) {
      const systemRoles = await this.findSystemRoles();
      if (systemRoles.length > 0) {
        throw new Error('Cannot modify system roles in bulk');
      }
    }

    const result = await this.nativeUpdate(criteria, updates);
    return result;
  }

  /**
   * Get roles with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    filters?: {
      name?: string;
      code?: string;
      isDefault?: boolean;
      isSystem?: boolean;
    },
  ): Promise<{
    roles: RoleEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;
    const where: any = {};

    if (filters?.name) where.name = filters.name;
    if (filters?.code) where.code = filters.code;
    if (filters?.isDefault !== undefined) where.isDefault = filters.isDefault;
    if (filters?.isSystem !== undefined) where.isSystem = filters.isSystem;

    const [roles, total] = await Promise.all([
      this.find(where, { limit, offset, orderBy: { name: 'ASC' } }),
      this.count(where),
    ]);

    return {
      roles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all permissions used across all roles
   */
  async getAllPermissions(): Promise<string[]> {
    const result = await this.em.execute(`
      SELECT DISTINCT jsonb_array_elements_text(permissions) as permission
      FROM roles
      ORDER BY permission
    `);
    return result.map((row: any) => row.permission);
  }

  /**
   * Get roles with their user assignments
   */
  async findWithUserAssignments(): Promise<RoleEntity[]> {
    return this.find({}, { populate: ['userRoles'] });
  }

  /**
   * Get roles assigned to a specific user
   */
  async findAssignedToUser(userId: number): Promise<RoleEntity[]> {
    return this.find(
      { userRoles: { user: userId } },
      { populate: ['userRoles'] },
    );
  }

  /**
   * Check if a role code exists
   */
  async codeExists(code: string): Promise<boolean> {
    const role = await this.findOne({ code });
    return !!role;
  }

  /**
   * Check if a role name exists
   */
  async nameExists(name: string): Promise<boolean> {
    const role = await this.findOne({ name });
    return !!role;
  }

  /**
   * Get roles sorted by creation date
   */
  async findSortedByCreation(
    order: 'ASC' | 'DESC' = 'DESC',
  ): Promise<RoleEntity[]> {
    return this.find({}, { orderBy: { createdAt: order } });
  }

  /**
   * Get roles sorted by name
   */
  async findSortedByName(order: 'ASC' | 'DESC' = 'ASC'): Promise<RoleEntity[]> {
    return this.find({}, { orderBy: { name: order } });
  }

  /**
   * Get roles with the most permissions
   */
  async findWithMostPermissions(limit: number = 10): Promise<RoleEntity[]> {
    const result = await this.em.execute(
      `
      SELECT id, name, code, jsonb_array_length(permissions) as permission_count
      FROM roles
      ORDER BY permission_count DESC
      LIMIT $1
    `,
      [limit],
    );

    const roleIds = result.map((row: any) => row.id);
    return this.find({ id: { $in: roleIds } });
  }

  /**
   * Get roles with the least permissions
   */
  async findWithLeastPermissions(limit: number = 10): Promise<RoleEntity[]> {
    const result = await this.em.execute(
      `
      SELECT id, name, code, jsonb_array_length(permissions) as permission_count
      FROM roles
      ORDER BY permission_count ASC
      LIMIT $1
    `,
      [limit],
    );

    const roleIds = result.map((row: any) => row.id);
    return this.find({ id: { $in: roleIds } });
  }
}
