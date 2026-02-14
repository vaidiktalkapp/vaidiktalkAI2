'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { XCircle, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

interface ScheduledNotification {
  _id?: string; 
  scheduleId: string;
  title: string;
  message: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  recipientType: string;
  type: string;
}

export default function ScheduledNotificationsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // 1. Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ['scheduled-notifications', page, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getScheduledNotifications({
        status: statusFilter || undefined,
        page,
        limit: 20,
      });
      return response.data.data; // Expected { notifications: [], pagination: {} }
    },
    enabled: can('manage_notifications'),
  });

  // 2. Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancelScheduledNotification(id),
    onSuccess: () => {
      toast.success('Notification cancelled');
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
    },
    onError: () => toast.error('Failed to cancel notification'),
  });

  // 3. Columns
  const columns: Column<ScheduledNotification>[] = [
    {
      header: 'Title',
      accessorKey: 'title',
      cell: (item) => <span className="font-medium text-gray-900">{item.title}</span>
    },
    {
      header: 'Message',
      cell: (item) => <span className="text-gray-500 truncate max-w-[300px] block">{item.message}</span>
    },
    {
      header: 'Scheduled For',
      cell: (item) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Clock size={14} />
          {new Date(item.scheduledFor).toLocaleString()}
        </div>
      )
    },
    {
      header: 'Target',
      accessorKey: 'recipientType',
      cell: (item) => <span className="capitalize badge badge-gray">{item.recipientType.replace('_', ' ')}</span>
    },
    {
      header: 'Status',
      cell: (item) => {
        const colors = {
          pending: 'bg-yellow-100 text-yellow-800',
          sent: 'bg-green-100 text-green-800',
          cancelled: 'bg-gray-100 text-gray-800',
          failed: 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[item.status]}`}>
            {item.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        item.status === 'pending' && (
          <button 
            onClick={() => {
              if(confirm('Cancel this notification?')) cancelMutation.mutate(item.scheduleId);
            }}
            className="text-red-600 hover:text-red-800 flex items-center justify-end gap-1 text-sm font-medium w-full"
          >
            <XCircle size={16} /> Cancel
          </button>
        )
      )
    }
  ];

  if (!can('manage_notifications')) return <div className="p-12 text-center">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Scheduled Notifications</h1>
        <p className="text-gray-600 mt-1">Manage upcoming broadcasts</p>
      </div>

      <FilterBar 
        filters={[
          {
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Sent', value: 'sent' },
              { label: 'Cancelled', value: 'cancelled' },
              { label: 'Failed', value: 'failed' }
            ],
            placeholder: "Filter by Status"
          }
        ]}
        onReset={() => { setStatusFilter('pending'); setPage(1); }}
      />

      <DataTable
        data={data?.notifications || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage
        }}
        emptyMessage="No scheduled notifications found"
      />
    </div>
  );
}
