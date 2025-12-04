'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TransactionsListProps {
  userId: string;
  limit?: number;
}

export default function TransactionsList({ userId, limit = 5 }: TransactionsListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-transactions', userId],
    queryFn: async () => {
      const response = await adminApi.getAllTransactions({
        userId,
        limit,
        page: 1,
      });
      return response.data.data;
    },
  });

  if (isLoading) return <div className="animate-pulse h-20 bg-gray-100 rounded"></div>;

  if (!data?.transactions?.length) {
    return <p className="text-gray-500 text-sm">No transactions yet</p>;
  }

  return (
    <div className="space-y-2">
      {data.transactions.map((txn: any) => (
        <div key={txn._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
              {txn.type === 'credit' ? (
                <ArrowDown className="text-green-600" size={16} />
              ) : (
                <ArrowUp className="text-red-600" size={16} />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{txn.description || txn.type}</p>
              <p className="text-xs text-gray-500">{new Date(txn.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <span className={`font-bold ${txn.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
            {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
          </span>
        </div>
      ))}
    </div>
  );
}
