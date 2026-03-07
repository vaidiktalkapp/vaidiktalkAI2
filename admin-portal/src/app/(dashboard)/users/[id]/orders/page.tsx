'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ArrowLeft, ExternalLink, MessageSquare, Phone, Video } from 'lucide-react';
import Link from 'next/link';

interface Order {
  _id: string;
  orderId: string;
  type: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  astrologerId?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
}

export default function UserOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [page, setPage] = useState(1);

  // Fetch Orders
  const { data, isLoading } = useQuery({
    queryKey: ['user-orders-full', userId, page],
    queryFn: async () => {
      const response = await adminApi.getUserOrders(userId, page, 20);
      return response.data.data;
    },
  });

  const columns: Column<Order>[] = [
    {
      header: 'Order ID',
      accessorKey: 'orderId',
      cell: (order) => (
        <Link href={`/orders/${order.orderId}`} className="font-mono font-medium text-indigo-600 hover:underline flex items-center gap-1">
          {order.orderId} <ExternalLink size={12} />
        </Link>
      ),
    },
    {
      header: 'Service Type',
      cell: (order) => {
        const icons: any = {
          chat: <MessageSquare size={14} />,
          call: <Phone size={14} />,
          video_call: <Video size={14} />,
        };
        return (
          <div className="flex items-center gap-2 text-gray-700 capitalize">
            {icons[order.type] || null}
            {order.type.replace('_', ' ')}
          </div>
        );
      },
    },
    {
      header: 'Astrologer',
      cell: (order) => (
        order.astrologerId ? (
          <div className="flex items-center gap-2">
            {order.astrologerId.profilePicture ? (
              <img src={order.astrologerId.profilePicture} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                {order.astrologerId.name[0]}
              </div>
            )}
            <span className="text-sm font-medium">{order.astrologerId.name}</span>
          </div>
        ) : <span className="text-gray-400 italic">Unknown</span>
      ),
    },
    {
      header: 'Amount',
      accessorKey: 'totalAmount',
      cell: (order) => <span className="font-bold">{order.totalAmount} Cr</span>,
    },
    {
      header: 'Date',
      cell: (order) => new Date(order.createdAt).toLocaleDateString() + ' ' + new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    {
      header: 'Status',
      cell: (order) => {
        const colors: any = {
          completed: 'bg-green-100 text-green-800',
          cancelled: 'bg-red-100 text-red-800',
          pending: 'bg-yellow-100 text-yellow-800',
          rejected: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[order.status] || 'bg-gray-100'}`}>
            {order.status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
          <p className="text-gray-500">View all service requests and orders for this user</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <DataTable
          data={data?.orders || []}
          columns={columns}
          isLoading={isLoading}
          pagination={{
            page: page,
            totalPages: data?.pagination?.pages || 1,
            onPageChange: setPage,
          }}
        />
      </div>
    </div>
  );
}