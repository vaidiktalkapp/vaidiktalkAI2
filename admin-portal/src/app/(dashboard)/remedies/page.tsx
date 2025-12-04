'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Sparkles, TrendingUp, ShoppingCart } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

// Define types locally or import from a shared types file
interface Remedy {
  _id: string;
  title?: string;
  remedySource: 'manual' | 'shopify_product';
  shopifyProduct?: { productName: string; type: string };
  type: string;
  astrologerName: string;
  status: string;
  isPurchased: boolean;
  createdAt: string;
}

export default function RemediesPage() {
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { can } = usePermission();

  // 1. Fetch Data
  const { data, isLoading } = useQuery({
    queryKey: ['remedies', page, sourceFilter, statusFilter],
    queryFn: async () => {
      if (sourceFilter) {
        return (await adminApi.getRemediesBySource(sourceFilter, { page, limit: 20 })).data.data;
      } else if (statusFilter) {
        return (await adminApi.getRemediesByStatus(statusFilter, { page, limit: 20 })).data.data;
      }
      return (await adminApi.getAllRemedies({ page, limit: 20 })).data.data;
    },
    enabled: can('view_remedies'),
  });

  const { data: stats } = useQuery({
    queryKey: ['remedies-stats'],
    queryFn: async () => {
      const response = await adminApi.getRemediesStats();
      return response.data.data;
    },
    enabled: can('view_remedies'),
  });

  // 2. Define Columns
  const columns: Column<Remedy>[] = [
    {
      header: 'Remedy',
      cell: (remedy) => (
        <div>
          <p className="font-medium text-gray-900">
            {remedy.remedySource === 'manual' ? remedy.title : remedy.shopifyProduct?.productName}
          </p>
          <span className="text-xs text-gray-500 capitalize bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
            {remedy.remedySource.replace('_', ' ')}
          </span>
        </div>
      )
    },
    {
      header: 'Type',
      cell: (remedy) => (
        <span className="text-sm text-gray-700">
          {remedy.remedySource === 'manual' ? remedy.type : remedy.shopifyProduct?.type || 'Product'}
        </span>
      )
    },
    {
      header: 'Astrologer',
      accessorKey: 'astrologerName',
      className: 'text-gray-600'
    },
    {
      header: 'Status',
      cell: (remedy) => {
        const colors: Record<string, string> = {
          accepted: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
          suggested: 'bg-yellow-100 text-yellow-800'
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[remedy.status] || 'bg-gray-100'}`}>
            {remedy.status}
          </span>
        );
      }
    },
    {
      header: 'Purchased',
      cell: (remedy) => (
        remedy.isPurchased 
          ? <span className="text-green-600 font-medium flex items-center gap-1"><ShoppingCart size={14}/> Yes</span> 
          : <span className="text-gray-400">No</span>
      )
    },
    {
      header: 'Date',
      cell: (remedy) => new Date(remedy.createdAt).toLocaleDateString()
    }
  ];

  if (!can('view_remedies')) return <div className="p-12 text-center text-gray-500">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Remedies Management</h1>
        <p className="text-gray-600 mt-1">Monitor suggestions and conversion</p>
      </div>

      {/* Stats Grid - Simplified for cleaner code */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatBox label="Total Suggested" value={stats?.summary?.totalRemedies || 0} icon={Sparkles} color="text-blue-600" />
        <StatBox label="Accepted" value={stats?.summary?.acceptedRemedies || 0} icon={TrendingUp} color="text-green-600" />
        <StatBox label="Purchased" value={stats?.summary?.purchasedRemedies || 0} icon={ShoppingCart} color="text-purple-600" />
      </div>

      <FilterBar 
        filters={[
          {
            value: sourceFilter,
            onChange: (val) => { setSourceFilter(val); setPage(1); },
            options: [
              { label: 'Manual Remedies', value: 'manual' },
              { label: 'Shopify Products', value: 'shopify_product' }
            ],
            placeholder: "All Sources"
          },
          {
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Suggested', value: 'suggested' },
              { label: 'Accepted', value: 'accepted' },
              { label: 'Rejected', value: 'rejected' }
            ],
            placeholder: "All Status"
          }
        ]}
        onReset={() => { setSourceFilter(''); setStatusFilter(''); setPage(1); }}
      />

      <DataTable
        data={data?.remedies || []}
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

// Helper Component
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
