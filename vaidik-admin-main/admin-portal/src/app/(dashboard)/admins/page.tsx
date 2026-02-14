'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { Shield, UserPlus, Activity } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  roleType: string;
  status: string;
  lastLoginAt?: string;
  department?: string;
}

export default function AdminsPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const { can } = usePermission();

  // Fetch Admins
  const { data, isLoading } = useQuery({
    queryKey: ['admins', page, searchQuery, roleFilter],
    queryFn: async () => {
      const response = await adminApi.getAllAdmins({
        page,
        limit: 20,
        search: searchQuery,
        role: roleFilter || undefined,
      });
      return response.data.data;
    },
    enabled: can('manage_admins'),
  });

  // Define Columns
  const columns: Column<AdminUser>[] = [
    {
      header: 'Admin',
      cell: (admin) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {admin.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{admin.name}</p>
            <p className="text-xs text-gray-500">{admin.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (admin) => {
        const colors: Record<string, string> = {
          super_admin: 'bg-purple-100 text-purple-800',
          admin: 'bg-blue-100 text-blue-800',
          moderator: 'bg-green-100 text-green-800',
          support: 'bg-yellow-100 text-yellow-800',
          finance: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[admin.roleType] || 'bg-gray-100'}`}>
            {admin.roleType.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      header: 'Department',
      accessorKey: 'department',
      cell: (admin) => admin.department || '—',
    },
    {
      header: 'Last Login',
      cell: (admin) => admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never',
      className: 'text-gray-500 text-sm',
    },
    {
      header: 'Status',
      cell: (admin) => (
        <span className={`flex items-center gap-1 text-xs font-medium ${admin.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
          <div className={`w-2 h-2 rounded-full ${admin.status === 'active' ? 'bg-green-600' : 'bg-red-600'}`} />
          {admin.status === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (admin) => (
        <Link 
          href={`/admins/${admin._id}`}
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          View Details
        </Link>
      ),
    },
  ];

  if (!can('manage_admins')) {
    return <div className="p-12 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Control access and permissions</p>
        </div>
        {can('create_admins') && (
          <Link 
            href="/admins/create" 
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <UserPlus size={18} />
            <span>Create Admin</span>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Admins" 
          value={data?.pagination?.total || 0}
          icon={Shield}
          color="text-indigo-600"
        />
        <StatCard 
          label="Active" 
          value={data?.admins?.filter((a: AdminUser) => a.status === 'active').length || 0}
          icon={Activity}
          color="text-green-600"
        />
        <StatCard 
          label="Super Admins" 
          value={data?.admins?.filter((a: AdminUser) => a.roleType === 'super_admin').length || 0}
          icon={Shield}
          color="text-purple-600"
        />
        <StatCard 
          label="Support Staff" 
          value={data?.admins?.filter((a: AdminUser) => a.roleType === 'support').length || 0}
          icon={UserPlus}
          color="text-yellow-600"
        />
      </div>

      <FilterBar
        filters={[
          {
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: 'Super Admin', value: 'super_admin' },
              { label: 'Admin', value: 'admin' },
              { label: 'Moderator', value: 'moderator' },
              { label: 'Support', value: 'support' },
              { label: 'Finance', value: 'finance' },
            ],
            placeholder: 'All Roles',
            label: 'Filter by Role',
          },
        ]}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search admins by name or email..."
        onReset={() => {
          setSearchQuery('');
          setRoleFilter('');
          setPage(1);
        }}
      />

      <DataTable
        data={data?.admins || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <Icon className={color} size={32} />
    </div>
  );
}
