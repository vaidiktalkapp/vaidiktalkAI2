// src/app/(dashboard)/orders/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { Eye, RefreshCw, XCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

// ✅ Architecture Components
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

// Define Order Type
interface Order {
  _id: string;
  orderId: string;
  userId: { name: string; phoneNumber: string };
  astrologerId: { name: string };
  type: 'chat' | 'call' | 'video_call';
  totalAmount: number;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const { can } = usePermission();

  // 1. Data Fetching
  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter, typeFilter],
    queryFn: async () => {
      const response = await adminApi.getAllOrders({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
      });
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const response = await adminApi.getOrderStats();
      return response.data.data;
    },
  });

  // 2. Column Definitions
  const columns: Column<Order>[] = [
    {
      header: 'Order ID',
      accessorKey: 'orderId',
      cell: (order) => <span className="font-mono text-xs font-medium">{order.orderId}</span>
    },
    {
      header: 'User',
      cell: (order) => (
        <div>
          <p className="font-medium text-gray-900">{order.userId?.name || 'Unknown'}</p>
          <p className="text-xs text-gray-500">{order.userId?.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: 'Astrologer',
      cell: (order) => <p className="text-gray-700">{order.astrologerId?.name || 'N/A'}</p>
    },
    {
      header: 'Type',
      cell: (order) => {
        const icons = { chat: '💬', call: '📞', video_call: '📹' };
        return (
          <span className="capitalize flex items-center gap-2">
            <span>{icons[order.type]}</span> {order.type.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      header: 'Amount',
      cell: (order) => (
        <span className="font-medium text-green-700 flex items-center">
          <DollarSign size={14} /> {order.totalAmount}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (order) => {
        const colors = {
          completed: 'bg-green-100 text-green-800',
          ongoing: 'bg-blue-100 text-blue-800',
          pending: 'bg-yellow-100 text-yellow-800',
          cancelled: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[order.status]}`}>
            {order.status}
          </span>
        );
      },
    },
    {
      header: 'Date',
      cell: (order) => new Date(order.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (order) => (
        <div className="flex justify-end gap-2">
          <Link href={`/orders/${order.orderId}`} className="p-2 hover:bg-gray-100 rounded-full text-indigo-600 transition-colors">
            <Eye size={18} />
          </Link>
        </div>
      ),
    },
  ];

  // 3. Security Gate
  if (!can('view_orders')) {
    return <div className="p-8 text-center text-gray-500">You do not have permission to view orders.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600 mt-1">Track and manage all consultation orders</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats?.total || 0} />
        <StatCard label="Completed" value={stats?.completed || 0} color="text-green-600" />
        <StatCard label="Cancelled" value={stats?.cancelled || 0} color="text-red-600" />
        <StatCard label="Revenue" value={`₹${stats?.revenue?.toLocaleString() || 0}`} color="text-blue-600" />
      </div>

      {/* Filters */}
      <FilterBar
        search={{
          value: search,
          onChange: (val) => { setSearch(val); setPage(1); },
          placeholder: 'Search Order ID or User...'
        }}
        filters={[
          {
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Ongoing', value: 'ongoing' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ],
            placeholder: 'All Status'
          },
          {
            value: typeFilter,
            onChange: (val) => { setTypeFilter(val); setPage(1); },
            options: [
              { label: 'Chat', value: 'chat' },
              { label: 'Call', value: 'call' },
              { label: 'Video', value: 'video_call' },
            ],
            placeholder: 'All Types'
          }
        ]}
        onReset={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}
      />

      {/* Data Table */}
      <DataTable
        data={data?.orders || []}
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

// Reusable Stat Card (Same as UsersPage - consistency!)
function StatCard({ label, value, color = "text-gray-900" }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
