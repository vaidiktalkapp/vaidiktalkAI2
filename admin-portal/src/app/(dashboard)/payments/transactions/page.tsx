'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import { IndianRupee, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface Transaction {
  _id: string;
  transactionId: string;
  userId: { name: string; phoneNumber: string };
  type: string;
  amount: number;
  status: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, typeFilter, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getAllTransactions({
        page,
        limit: 20,
        type: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      return response.data.data;
    },
    enabled: can('view_payments'),
  });

  const { data: stats } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: async () => {
      const response = await adminApi.getTransactionStats();
      return response.data.data;
    },
    enabled: can('view_payments'),
  });

  const columns: Column<Transaction>[] = [
    {
      header: 'Transaction ID',
      cell: (txn) => (
        <span className="font-mono text-xs text-gray-600">{txn.transactionId}</span>
      ),
    },
    {
      header: 'User',
      cell: (txn) => (
        <div>
          <p className="font-medium text-gray-900">{txn.userId?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500">{txn.userId?.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (txn) => {
        const colors: Record<string, string> = {
          recharge: 'bg-green-100 text-green-800',
          deduction: 'bg-red-100 text-red-800',
          refund: 'bg-blue-100 text-blue-800',
          bonus: 'bg-purple-100 text-purple-800',
          giftcard: 'bg-yellow-100 text-yellow-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[txn.type] || 'bg-gray-100 text-gray-800'}`}>
            {txn.type}
          </span>
        );
      },
    },
    {
      header: 'Amount',
      cell: (txn) => {
        const isCredit = ['recharge', 'refund', 'bonus', 'giftcard'].includes(txn.type);
        return (
          <span className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
            {isCredit ? '+' : '-'}₹{txn.amount.toLocaleString()}
          </span>
        );
      },
    },
    {
      header: 'Balance',
      cell: (txn) => (
        <div className="text-xs text-gray-600">
          <div>Before: ₹{txn.balanceBefore}</div>
          <div>After: ₹{txn.balanceAfter}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (txn) => {
        const colors: Record<string, string> = {
          completed: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          failed: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[txn.status]}`}>
            {txn.status}
          </span>
        );
      },
    },
    {
      header: 'Date',
      cell: (txn) => new Date(txn.createdAt).toLocaleString(),
      className: 'text-gray-500 text-sm',
    },
  ];

  if (!can('view_payments')) {
    return <div className="p-12 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">Monitor all wallet transactions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Recharged" value={`₹${(stats?.totalRecharge || 0).toLocaleString()}`} icon={TrendingUp} color="text-green-600" />
        <StatCard label="Total Spent" value={`₹${(stats?.totalSpent || 0).toLocaleString()}`} icon={TrendingDown} color="text-red-600" />
        <StatCard label="Bonuses Credited" value={`₹${(stats?.totalBonusCredited || 0).toLocaleString()}`} icon={IndianRupee} color="text-purple-600" />
        <StatCard label="Refunds Processed" value={`₹${(stats?.totalOrderRefunds || 0).toLocaleString()}`} icon={RefreshCw} color="text-blue-600" />
      </div>

      <FilterBar
        filters={[
          {
            value: typeFilter,
            onChange: (val) => { setTypeFilter(val); setPage(1); },
            options: [
              { label: 'Recharge', value: 'recharge' },
              { label: 'Deduction', value: 'deduction' },
              { label: 'Refund', value: 'refund' },
              { label: 'Bonus', value: 'bonus' },
              { label: 'Gift Card', value: 'giftcard' },
            ],
            placeholder: 'All Types',
          },
          {
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Completed', value: 'completed' },
              { label: 'Pending', value: 'pending' },
              { label: 'Failed', value: 'failed' },
            ],
            placeholder: 'All Status',
          },
        ]}
        onReset={() => { setTypeFilter(''); setStatusFilter(''); setPage(1); }}
      />

      <DataTable
        data={data?.transactions || []}
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

function StatCard({ label, value, icon: Icon, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between border border-gray-100">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <Icon className={color} size={32} />
    </div>
  );
}
