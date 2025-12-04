'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Filter, CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

interface LogEntry {
  _id: string;
  adminId: { name: string };
  action: string;
  module: string;
  targetType?: string;
  targetId?: string;
  status: 'success' | 'failed' | 'warning';
  createdAt: string;
  details?: any;
}

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, moduleFilter, actionFilter],
    queryFn: async () => {
      const response = await adminApi.getActivityLogs({
        page,
        limit: 20,
        module: moduleFilter || undefined,
        action: actionFilter || undefined,
      });
      return response.data.data; // Expected { logs: [], pagination: {} }
    },
    enabled: can('view_logs'),
  });

  const columns: Column<LogEntry>[] = [
    {
      header: 'Status',
      cell: (log) => {
        const icons = {
          success: <CheckCircle size={18} className="text-green-500" />,
          failed: <XCircle size={18} className="text-red-500" />,
          warning: <AlertCircle size={18} className="text-yellow-500" />
        };
        return icons[log.status] || <Activity size={18} className="text-gray-400" />;
      },
      className: 'w-12'
    },
    {
      header: 'Admin',
      cell: (log) => <span className="font-medium text-gray-900">{log.adminId?.name || 'System'}</span>
    },
    {
      header: 'Action',
      cell: (log) => (
        <div>
          <span className="font-medium text-gray-800">{log.action}</span>
          {log.targetType && (
            <span className="text-xs text-gray-500 block">
              Target: {log.targetType} ({log.targetId?.slice(-6)})
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Module',
      cell: (log) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 capitalize">
          {log.module}
        </span>
      )
    },
    {
      header: 'Date',
      cell: (log) => new Date(log.createdAt).toLocaleString(),
      className: 'text-gray-500 whitespace-nowrap'
    },
    {
      header: 'Details',
      cell: (log) => (
        <span className="text-xs text-gray-400 font-mono max-w-[200px] truncate block" title={JSON.stringify(log.details)}>
          {JSON.stringify(log.details)}
        </span>
      )
    }
  ];

  if (!can('view_logs')) return <div className="p-12 text-center text-gray-500">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600 mt-1">Audit trail of all administrative actions</p>
      </div>

      <FilterBar 
        filters={[
          {
            value: moduleFilter,
            onChange: (val) => { setModuleFilter(val); setPage(1); },
            options: [
              { label: 'Users', value: 'users' },
              { label: 'Orders', value: 'orders' },
              { label: 'Auth', value: 'auth' },
              { label: 'Payments', value: 'payments' }
            ],
            placeholder: "All Modules"
          },
          {
            value: actionFilter,
            onChange: (val) => { setActionFilter(val); setPage(1); },
            options: [
              { label: 'Create', value: 'create' },
              { label: 'Update', value: 'update' },
              { label: 'Delete', value: 'delete' },
              { label: 'Login', value: 'login' }
            ],
            placeholder: "All Actions"
          }
        ]}
        onReset={() => { setModuleFilter(''); setActionFilter(''); setPage(1); }}
      />

      <DataTable
        data={data?.logs || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage
        }}
      />
    </div>
  );
}
