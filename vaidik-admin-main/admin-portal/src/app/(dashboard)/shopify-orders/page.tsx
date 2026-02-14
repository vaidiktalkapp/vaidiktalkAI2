'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { TrendingUp, Package, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

interface ShopifyOrder {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  lineItems: any[];
  totalPrice: string;
  financialStatus: string;
  shopifyCreatedAt: string;
}

export default function ShopifyOrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['shopify-orders', page, search, statusFilter],
    queryFn: async () => {
      if (search) {
        return (await adminApi.searchShopifyOrders(search, { page, limit: 20 })).data.data;
      } else if (statusFilter) {
        return (await adminApi.getShopifyOrdersByStatus(statusFilter, { page, limit: 20 })).data.data;
      }
      return (await adminApi.getAllShopifyOrders({ page, limit: 20 })).data.data;
    },
    enabled: can('view_shopify'),
  });

  const { data: stats } = useQuery({
    queryKey: ['shopify-stats'],
    queryFn: async () => (await adminApi.getShopifyOrdersStats()).data.data,
    enabled: can('view_shopify'),
  });

  const columns: Column<ShopifyOrder>[] = [
    {
      header: 'Order #',
      cell: (order) => (
        <Link href={`/shopify-orders/${order._id}`} className="font-medium text-indigo-600 hover:underline flex items-center gap-1">
          {order.orderNumber} <LinkIcon size={12} />
        </Link>
      )
    },
    {
      header: 'Customer',
      cell: (order) => (
        <div>
          <p className="font-medium text-gray-900">{order.customerName}</p>
          <p className="text-xs text-gray-500">{order.customerPhone}</p>
        </div>
      )
    },
    {
      header: 'Items',
      cell: (order) => <span className="text-sm text-gray-600">{order.lineItems.length} items</span>
    },
    {
      header: 'Amount',
      cell: (order) => <span className="font-semibold text-gray-900">₹{parseFloat(order.totalPrice).toLocaleString()}</span>
    },
    {
      header: 'Payment',
      cell: (order) => {
        const colors: Record<string, string> = {
          paid: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          refunded: 'bg-gray-100 text-gray-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[order.financialStatus] || 'bg-gray-100'}`}>
            {order.financialStatus}
          </span>
        );
      }
    },
    {
      header: 'Date',
      cell: (order) => new Date(order.shopifyCreatedAt).toLocaleDateString()
    }
  ];

  if (!can('view_shopify')) return <div className="p-12 text-center">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shopify Orders</h1>
        <p className="text-gray-600 mt-1">Synced e-commerce transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox label="Total Orders" value={stats?.summary?.totalOrders || 0} icon={Package} color="text-blue-600" />
        <StatBox label="Paid Orders" value={stats?.summary?.paidOrders || 0} icon={TrendingUp} color="text-green-600" />
        <StatBox label="Total Revenue" value={`₹${(stats?.summary?.totalRevenue || 0).toLocaleString()}`} icon={TrendingUp} color="text-purple-600" />
      </div>

      <FilterBar 
        search={{
          value: search,
          onChange: (val) => { setSearch(val); setPage(1); },
          placeholder: "Search orders..."
        }}
        filters={[
          {
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Paid', value: 'paid' },
              { label: 'Pending', value: 'pending' },
              { label: 'Fulfilled', value: 'fulfilled' }
            ],
            placeholder: "All Status"
          }
        ]}
        onReset={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
      />

      <DataTable
        data={data?.orders || []}
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

function StatBox({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <Icon className={color} size={32} />
    </div>
  );
}
