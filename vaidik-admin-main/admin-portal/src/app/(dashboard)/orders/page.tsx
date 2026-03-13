'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { Eye, Coins, Phone, MessageCircle, Video, Clock } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import { usePathname, useRouter } from 'next/navigation';

// Extended Order Interface
interface Order {
  _id: string;
  orderId: string;
  userId: { name: string; phoneNumber: string; profileImage?: string };
  astrologerId: { name: string; profilePicture?: string };
  type: 'chat' | 'call' | 'video_call';
  totalAmount: number;
  status: 'pending' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  duration?: number; // In seconds
}

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const { can } = usePermission();

  // Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getAllOrders({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
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

  // Helper for Duration Formatting
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const columns: Column<Order>[] = [
    {
      header: 'Order ID',
      accessorKey: 'orderId',
      cell: (order) => (
        <Link href={`/orders/${order.orderId}`} className="font-mono text-xs font-medium text-indigo-600 hover:underline">
          {order.orderId}
        </Link>
      )
    },
    {
      header: 'Customer',
      cell: (order) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {order.userId?.profileImage ? (
              <img src={order.userId.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-500">{order.userId?.name?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{order.userId?.name || 'Unknown'}</p>
            <p className="text-xs text-gray-500">{order.userId?.phoneNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Astrologer',
      cell: (order) => <p className="text-sm text-gray-700">{order.astrologerId?.name || 'N/A'}</p>
    },
    {
      header: 'Amount',
      cell: (order) => (
        <span className="font-medium text-green-700 flex items-center text-sm">
          <Coins size={12} /> ₹{order.totalAmount}
        </span>
      )
    },
    {
      header: 'Status',
      cell: (order) => {
        const colors: any = {
          completed: 'bg-green-100 text-green-800 border-green-200',
          ongoing: 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse',
          pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          cancelled: 'bg-red-100 text-red-800 border-red-200',
        };
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[order.status]}`}>
            {order.status}
          </span>
        );
      },
    },
    {
      header: 'Date',
      cell: (order) => <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>,
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (order) => (
        <div className="flex justify-end">
          <Link href={`/orders/${order.orderId}`} className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-indigo-600 transition-colors">
            <Eye size={16} />
          </Link>
        </div>
      ),
    },
  ];

  if (!can('view_orders')) return <div className="p-8 text-center text-gray-500">Access Denied</div>;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
          <p className="text-sm text-gray-500">Overview of all platform activities</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => router.push('/orders')}
            className="px-4 py-1.5 text-sm font-medium bg-white text-gray-900 shadow-sm rounded-md"
          >
            All Orders
          </button>
          <button
            onClick={() => router.push('/orders/calls')}
            className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md"
          >
            Calls & Video
          </button>
          <button
            onClick={() => router.push('/orders/chats')}
            className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md"
          >
            Chats
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={stats?.total || 0} />
        <StatCard label="Completed" value={stats?.completed || 0} color="text-green-600" />
        <StatCard label="Cancelled" value={stats?.cancelled || 0} color="text-red-600" />
        <StatCard label="Total Revenue" value={`₹${stats?.revenue?.toLocaleString() || 0}`} color="text-indigo-600" />
      </div>

      {/* Filters */}
      <FilterBar
        searchQuery={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        searchPlaceholder="Search Order ID or User..."
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
          }
        ]}
        onReset={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
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

function StatCard({ label, value, color = "text-gray-900" }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}