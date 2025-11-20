// src/hooks/use-permission.ts
import { useAuthStore } from '@/store/authStore';
import { ROLE_PERMISSIONS, Permission, RoleType } from '@/lib/rbac/roles';

export function usePermission() {
  const { admin } = useAuthStore();

  /**
   * Check if the current user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    if (!admin) return false;
    
    // Super Admin has god mode
    if (admin.roleType === 'super_admin') return true;
    
    const userRole = admin.roleType as RoleType;
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    
    return permissions.includes(permission);
  };

  /**
   * Check if the user has ANY of the provided permissions
   */
  const hasAny = (permissions: Permission[]): boolean => {
    return permissions.some(p => can(p));
  };

  /**
   * Check if user matches a specific role
   */
  const isRole = (role: RoleType): boolean => {
    return admin?.roleType === role;
  };

  return { 
    can, 
    hasAny, 
    isRole,
    role: admin?.roleType as RoleType,
    user: admin 
  };
}
