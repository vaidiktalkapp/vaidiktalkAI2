'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import { IndianRupee, TrendingUp, TrendingDown, RefreshCw, Undo2, Search, X } from 'lucide-react';
import { toast } from 'sonner';

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
  paymentGateway?: string;
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Client-side Search and Date Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState('');

  // Fetch data without search/date params
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

  // Client-side filtering using useMemo for performance
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];

    let filtered = [...data.transactions];

    // Search filter (transaction ID, user name, phone number)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((txn) => {
        const transactionIdMatch = txn.transactionId?.toLowerCase().includes(searchLower);
        const nameMatch = txn.userId?.name?.toLowerCase().includes(searchLower);
        const phoneMatch = txn.userId?.phoneNumber?.includes(searchTerm);
        
        return transactionIdMatch || nameMatch || phoneMatch;
      });
    }

    // Date range filter
    if (startDate) {
      const startDateTime = new Date(startDate).setHours(0, 0, 0, 0);
      filtered = filtered.filter((txn) => {
        const txnDate = new Date(txn.createdAt).setHours(0, 0, 0, 0);
        return txnDate >= startDateTime;
      });
    }

    if (endDate) {
      const endDateTime = new Date(endDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter((txn) => {
        const txnDate = new Date(txn.createdAt).getTime();
        return txnDate <= endDateTime;
      });
    }

    return filtered;
  }, [data?.transactions, searchTerm, startDate, endDate]);

  // Refund Mutation
  const refundMutation = useMutation({
    mutationFn: () => {
      if (!selectedTxn) return Promise.reject('No transaction selected');
      return adminApi.refundRazorpayTransaction(selectedTxn.transactionId, refundReason);
    },
    onSuccess: (data: any) => {
      toast.success(data.data.message || 'Refund processed successfully');
      setShowRefundModal(false);
      setSelectedTxn(null);
      setRefundReason('');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Refund failed');
    },
  });

  const handleInitiateRefund = (txn: Transaction) => {
    setSelectedTxn(txn);
    setRefundReason('');
    setShowRefundModal(true);
  };

  const handleResetFilters = () => {
    setTypeFilter('');
    setStatusFilter('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = typeFilter || statusFilter || searchTerm || startDate || endDate;

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
          refunded: 'bg-orange-100 text-orange-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[txn.status] || 'bg-gray-100'}`}>
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
    {
      header: 'Actions',
      cell: (txn) => {
        if (txn.type === 'recharge' && txn.status === 'completed' && txn.paymentGateway === 'razorpay') {
          return (
            <button
              onClick={() => handleInitiateRefund(txn)}
              className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors text-xs flex items-center gap-1 border border-red-200 px-2"
              title="Refund to Source (Razorpay)"
            >
              <Undo2 size={12} /> Refund
            </button>
          );
        }
        return null;
      },
    }
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

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Transaction ID, User Name, or Phone Number..."
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {searchTerm && (
          <p className="text-xs text-gray-500 mt-2">
            Found {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Filters Row */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Types</option>
              <option value="recharge">Recharge</option>
              <option value="deduction">Deduction</option>
              <option value="refund">Refund</option>
              <option value="bonus">Bonus</option>
              <option value="giftcard">Gift Card</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Reset Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      <DataTable
        data={filteredTransactions}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />

      {/* Refund Modal */}
      {showRefundModal && selectedTxn && (
        <Modal title="Process Razorpay Refund" onClose={() => setShowRefundModal(false)}>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 text-sm text-yellow-800">
              <p className="font-semibold">Warning:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>This will initiate a refund via Razorpay for <strong>₹{selectedTxn.amount}</strong>.</li>
                <li>The user's <strong>Cash Balance</strong> will be deducted.</li>
                <li>Any <strong>Bonus</strong> earned from this recharge will be automatically removed.</li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Refund *</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Duplicate payment, Customer request..."
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => refundMutation.mutate()}
                disabled={!refundReason || refundMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
              </button>
              <button
                onClick={() => setShowRefundModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
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

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
