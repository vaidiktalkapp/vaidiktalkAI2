'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, AlertCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function DirectWalletRefundPage() {
  const [txnId, setTxnId] = useState('');
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');

  const handleSearch = async () => {
    if (!txnId) return;
    setLoading(true);
    setTransaction(null);
    try {
      // Fetch transactions and filter by transactionId
      const res = await adminApi.getAllTransactions({ limit: 100 });
      const found = res.data.data.transactions.find((txn: any) => txn.transactionId === txnId);
      
      if (found) {
        setTransaction(found);
      } else {
        toast.error('Transaction not found');
      }
    } catch (err) {
      toast.error('Error searching transaction');
    } finally {
      setLoading(false);
    }
  };

  // Note: You need a backend endpoint for this: /admin/payments/transactions/:id/refund
  // Since we don't have it in api.ts, assuming you will add it or map it to an existing logic
  const refundMutation = useMutation({
    mutationFn: () => adminApi.processWalletRefund(transaction._id, { 
      amountApproved: transaction.amount,
      paymentReference: `REFUND-${Date.now()}` // Mock ref
    }), 
    // Logic: This effectively calls your backend to process the reversal
    onSuccess: () => {
      toast.success('Transaction refunded successfully');
      setTransaction(null);
      setTxnId('');
    },
    onError: () => toast.error('Refund failed')
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Process Wallet Refund</h1>
        <p className="text-gray-500">Reverse a wallet recharge transaction (Gateway to Bank)</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            placeholder="e.g. TXN_123456789"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Searching...' : <><Search size={18} /> Search</>}
          </button>
        </div>
      </div>

      {transaction && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Transaction Details</p>
              <p className="font-bold text-lg text-gray-900">₹{transaction.amount}</p>
              <p className="text-xs text-gray-400">{new Date(transaction.createdAt).toLocaleString()}</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
              {transaction.status}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500">User</p>
                <p className="font-medium text-gray-900">{transaction.userId?.name || 'Unknown'}</p>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-500">Gateway Ref</p>
                <p className="font-mono text-sm text-gray-900">{transaction.paymentId || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Reversal</label>
            <textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Internal note for this refund..."
            />
          </div>

          <button 
            onClick={() => refundMutation.mutate()}
            disabled={!reason || refundMutation.isPending}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
          >
            {refundMutation.isPending ? 'Processing...' : 'Refund to Source (Gateway)'}
          </button>
        </div>
      )}
    </div>
  );
}