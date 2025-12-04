'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import { Eye, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface RefundRequest {
  _id: string;
  orderId: string;
  userId: { name: string; phoneNumber: string };
  refundRequest: {
    status: string;
    refundAmount: number;
    requestedAt: string;
    reason: string;
  };
  totalAmount: number;
}

export default function RefundsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['refund-requests', page, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getAllRefundRequests(page, 20, statusFilter);
      return response.data.data;
    },
    enabled: can('manage_refunds'),
  });

  const { data: stats } = useQuery({
    queryKey: ['refund-stats'],
    queryFn: async () => {
      const response = await adminApi.getRefundStats();
      return response.data.data;
    },
    enabled: can('manage_refunds'),
  });

  const columns: Column<RefundRequest>[] = [
    {
      header: 'Order ID',
      cell: (item) => (
        <Link href={`/orders/${item._id}`} className="text-indigo-600 hover:underline font-medium">
          {item.orderId}
        </Link>
      ),
    },
    {
      header: 'User',
      cell: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.userId?.name}</p>
          <p className="text-xs text-gray-500">{item.userId?.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: 'Order Amount',
      cell: (item) => <span className="font-semibold">₹{item.totalAmount}</span>,
    },
    {
      header: 'Refund Amount',
      cell: (item) => (
        <span className="font-bold text-red-600">₹{item.refundRequest?.refundAmount || 0}</span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => {
        const colors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.refundRequest?.status]}`}>
            {item.refundRequest?.status}
          </span>
        );
      },
    },
    {
      header: 'Requested',
      cell: (item) => new Date(item.refundRequest?.requestedAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (item) => (
        <Link href={`/orders/${item._id}`} className="text-indigo-600 hover:text-indigo-900">
          <Eye size={18} className="inline" />
        </Link>
      ),
    },
  ];

  if (!can('manage_refunds')) {
    return <div className="p-12 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Refund Requests</h1>
        <p className="text-gray-600 mt-1">Review and process refund requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox label="Total Requests" value={stats?.totalRequests || 0} />
        <StatBox label="Pending" value={stats?.pendingRequests || 0} color="text-yellow-600" />
        <StatBox label="Approved" value={stats?.approvedRequests || 0} color="text-green-600" />
        <StatBox label="Total Refunded" value={`₹${(stats?.totalRefunded || 0).toLocaleString()}`} color="text-purple-600" />
      </div>

      <FilterBar
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
            ],
            placeholder: 'All Status',
          },
        ]}
        onReset={() => setStatusFilter('pending')}
      />

      <DataTable
        data={data?.refundRequests || []}
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

function StatBox({ label, value, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
