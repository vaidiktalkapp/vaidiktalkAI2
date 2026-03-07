'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface OrdersListProps {
  userId: string;
  limit?: number;
}

export default function OrdersList({ userId, limit = 5 }: OrdersListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-orders', userId],
    queryFn: async () => {
      const response = await adminApi.getAllOrders({
        userId,
        limit,
        page: 1,
      });
      return response.data.data;
    },
  });

  if (isLoading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

  if (!data?.orders?.length) {
    return <p className="text-gray-500 text-sm">No orders yet</p>;
  }

  return (
    <div className="space-y-2">
      {data.orders.map((order: any) => (
        <Link
          key={order._id}
          href={`/orders/${order.orderId}`}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors group"
        >
          <div>
            <p className="font-medium text-gray-900 text-sm group-hover:text-indigo-600">{order.orderId}</p>
            <p className="text-xs text-gray-500">{order.type} • {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{order.totalAmount} Cr</span>
            <ExternalLink size={14} className="text-gray-400 group-hover:text-indigo-600" />
          </div>
        </Link>
      ))}
    </div>
  );
}
