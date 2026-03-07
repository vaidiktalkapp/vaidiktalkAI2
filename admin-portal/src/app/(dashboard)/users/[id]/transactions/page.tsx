'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ArrowLeft, ArrowDown, ArrowUp } from 'lucide-react';

interface Transaction {
  _id: string;
  transactionId: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
  balanceAfter?: number;
}

export default function UserTransactionsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [page, setPage] = useState(1);

  // Fetch Transactions
  const { data, isLoading } = useQuery({
    queryKey: ['user-transactions-full', userId, page],
    queryFn: async () => {
      const response = await adminApi.getUserTransactions(userId, page, 20);
      return response.data.data;
    },
  });

  const columns: Column<Transaction>[] = [
    {
      header: 'Transaction ID',
      accessorKey: 'transactionId',
      cell: (txn) => (
        <span className="font-mono text-xs text-gray-500">{txn.transactionId || txn._id}</span>
      ),
    },
    {
      header: 'Type / Description',
      cell: (txn) => (
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${txn.type.includes('credit') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
              {txn.type.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{txn.description}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (txn) => {
        const isCredit = txn.type.includes('credit') || txn.type === 'recharge';
        return (
          <div className={`font-bold flex items-center gap-1 ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
            {isCredit ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
            {txn.amount} Cr
          </div>
        );
      },
    },
    {
      header: 'Balance After',
      cell: (txn) => txn.balanceAfter ? `${txn.balanceAfter} Cr` : '-',
    },
    {
      header: 'Date',
      cell: (txn) => new Date(txn.createdAt).toLocaleString(),
    },
    {
      header: 'Status',
      cell: (txn) => (
        <span className={`text-xs capitalize ${txn.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
          }`}>
          {txn.status}
        </span>
      ),
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
          <h1 className="text-2xl font-bold text-gray-900">Wallet History</h1>
          <p className="text-gray-500">View all wallet transactions for this user</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <DataTable
          data={data?.transactions || []}
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