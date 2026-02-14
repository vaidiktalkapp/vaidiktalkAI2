// src/app/(dashboard)/users/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { Eye, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// ✅ Architecture Components
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

// Define User Type (Move to types/index.ts later if shared)
interface User {
  _id: string;
  name: string;
  email?: string;
  phoneNumber: string;
  status: 'active' | 'blocked' | 'inactive';
  createdAt: string;
}

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const { can } = usePermission();

  // 1. Data Fetching
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', page, search, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getAllUsers({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
      });
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await adminApi.getUserStats();
      return response.data.data;
    },
  });

  // 2. Actions
  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    if (!confirm(`Are you sure you want to mark this user as ${newStatus}?`)) return;
    try {
      await adminApi.updateUserStatus(userId, newStatus);
      toast.success(`User marked as ${newStatus}`);
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // 3. Define Columns Configuration
  const columns: Column<User>[] = [
    {
      header: 'User',
      cell: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
            {user.name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500">{user._id.slice(-6)}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (user) => (
        <div className="text-sm text-gray-600">
          <p>{user.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (user) => {
        const colors = {
          active: 'bg-green-100 text-green-800',
          blocked: 'bg-red-100 text-red-800',
          inactive: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[user.status] || colors.inactive}`}>
            {user.status}
          </span>
        );
      },
    },
    {
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (user) => (
        <div className="flex justify-end gap-2">
          {/* View Details */}
          <Link href={`/users/${user._id}`} className="p-2 hover:bg-gray-100 rounded-full text-indigo-600 transition-colors">
            <Eye size={18} />
          </Link>

          {/* Security Check: Only Managers Can Block */}
          {can('manage_users') && (
            user.status === 'active' ? (
              <button 
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(user._id, 'blocked'); }}
                className="p-2 hover:bg-red-50 rounded-full text-red-600 transition-colors"
                title="Block User"
              >
                <Ban size={18} />
              </button>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(user._id, 'active'); }}
                className="p-2 hover:bg-green-50 rounded-full text-green-600 transition-colors"
                title="Activate User"
              >
                <CheckCircle size={18} />
              </button>
            )
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-1">Manage all registered users</p>
      </div>

      {/* 2. Stats (Keep your existing stats grid layout here if you wish, simplified for example) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.total || 0} />
        <StatCard label="Active Users" value={stats?.active || 0} color="text-green-600" />
        <StatCard label="Blocked Users" value={stats?.blocked || 0} color="text-red-600" />
        <StatCard label="New This Month" value={stats?.newThisMonth || 0} color="text-blue-600" />
      </div>

      {/* 3. Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: (val) => { setSearch(val); setPage(1); },
          placeholder: 'Search users...'
        }}
        filters={[
          {
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Blocked', value: 'blocked' },
              { label: 'Inactive', value: 'inactive' },
            ],
            placeholder: 'All Status'
          }
        ]}
        onReset={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
      />

      {/* 4. The Master Data Table */}
      <DataTable
        data={data?.users || []}
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

// Simple Stat Helper Component
function StatCard({ label, value, color = "text-gray-900" }: { label: string, value: number, color?: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
