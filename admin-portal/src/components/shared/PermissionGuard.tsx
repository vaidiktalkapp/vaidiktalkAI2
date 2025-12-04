'use client';

import { usePermission } from '@/hooks/use-permission';
import { Permission } from '@/lib/rbac/roles';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface PermissionGuardProps {
  requiredPermission: Permission;
  children: React.ReactNode;
}

export default function PermissionGuard({ requiredPermission, children }: PermissionGuardProps) {
  const { can } = usePermission();
  const router = useRouter();

  // We use a layout effect or client check to redirect
  useEffect(() => {
    if (!can(requiredPermission)) {
      router.push('/dashboard'); // Kick them back to safety
    }
  }, [can, requiredPermission, router]);

  if (!can(requiredPermission)) {
    return null; // Prevent flash of content
  }

  return <>{children}</>;
}
