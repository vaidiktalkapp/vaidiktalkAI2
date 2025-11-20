// src/components/shared/RoleGuard.tsx
'use client';

import { usePermission } from '@/hooks/use-permission';
import { Permission } from '@/lib/rbac/roles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode; // Optional: Show "Access Denied" instead of null
}

export default function RoleGuard({ permission, children, fallback = null }: RoleGuardProps) {
  const { can } = usePermission();
  const router = useRouter();

  if (!can(permission)) {
    return <>{fallback}</>; 
  }

  return <>{children}</>;
}
