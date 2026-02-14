'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { CheckCircle, XCircle, AlertCircle, Activity } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

interface LogEntry {
  _id: string;
  adminId?: { name: string; email?: string };
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
      accessorKey: 'status',
      cell: (log) => {
        const icons = {
          success: <CheckCircle size={18} className="text-green-500" />,
          failed: <XCircle size={18} className="text-red-500" />,
          warning: <AlertCircle size={18} className="text-yellow-500" />
        };
        return (
          <div className="flex items-center justify-center">
            {icons[log.status] || <Activity size={18} className="text-gray-400" />}
          </div>
        );
      },
      className: 'w-12 text-center'
    },
    {
      header: 'Admin',
      cell: (log) => (
        <div>
          <p className="font-medium text-gray-900">{log.adminId?.name || 'System'}</p>
          {log.adminId?.email && <p className="text-xs text-gray-500">{log.adminId.email}</p>}
        </div>
      )
    },
    {
      header: 'Action',
      accessorKey: 'action',
      cell: (log) => (
        <div>
          <span className="font-medium text-gray-800 block">{log.action}</span>
          {log.targetType && (
            <span className="text-xs text-gray-500 block">
              Target: {log.targetType} {log.targetId ? `(${log.targetId.slice(-6)})` : ''}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Module',
      accessorKey: 'module',
      cell: (log) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200 capitalize font-medium">
          {log.module}
        </span>
      )
    },
    {
      header: 'Date',
      cell: (log) => (
        <span className="text-sm text-gray-600 whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Details',
      cell: (log) => {
        const detailsString = log.details ? JSON.stringify(log.details) : '';
        return (
          <div className="max-w-[250px] group relative">
            <span className="text-xs text-gray-400 font-mono truncate block cursor-help">
              {detailsString.length > 50 ? detailsString.substring(0, 50) + '...' : detailsString || '-'}
            </span>
            {/* Tooltip on hover for full details */}
            {detailsString && (
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10 break-all whitespace-pre-wrap">
                {detailsString}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  if (!can('view_logs')) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
        <p className="text-gray-500 mt-2">You do not have permission to view activity logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600 mt-1">Audit trail of all administrative actions and system events</p>
      </div>

      <FilterBar 
        searchPlaceholder="Search logs..." // Note: API might need text search support
        filters={[
          {
            value: moduleFilter,
            onChange: (val) => { setModuleFilter(val); setPage(1); },
            options: [
              { label: 'Users', value: 'users' },
              { label: 'Orders', value: 'orders' },
              { label: 'Auth', value: 'auth' },
              { label: 'Payments', value: 'payments' },
              { label: 'Astrologers', value: 'astrologers' },
              { label: 'System', value: 'system' }
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
              { label: 'Login', value: 'login' },
              { label: 'Process', value: 'process' }
            ],
            placeholder: "All Actions"
          }
        ]}
        onReset={() => { setModuleFilter(''); setActionFilter(''); setPage(1); }}
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
    </div>
  );
}