'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function DirectOrderRefundPage() {
  const [searchId, setSearchId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Refund Form State
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSearch = async () => {
    if (!searchId) return;
    setLoading(true);
    setOrder(null);
    try {
      // Assuming getOrderDetails supports searching by readable OrderID
      const res = await adminApi.getOrderDetails(searchId);
      setOrder(res.data.data);
      setAmount(res.data.data.totalAmount.toString()); // Default to full refund
    } catch (err) {
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const refundMutation = useMutation({
    mutationFn: () => adminApi.refundOrderDirect(order.orderId, {
      amount: parseFloat(amount),
      reason
    }),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      setOrder(null);
      setSearchId('');
      setAmount('');
      setReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Refund failed');
    }
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Process Order Refund</h1>
        <p className="text-gray-500">Directly refund an order to the user's wallet</p>
      </div>

      {/* Search Box */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Order ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="e.g. ORD-123456"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
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

      {/* Order Details & Refund Form */}
      {order && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900">Order #{order.orderId}</p>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
              {order.status}
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* Context Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Customer</p>
                <p className="font-medium">{order.userId?.name}</p>
                <p className="text-xs text-gray-400">{order.userId?.phoneNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Original Amount</p>
                <p className="font-bold text-lg text-gray-900">₹{order.totalAmount}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <RefreshCcw size={18} className="text-indigo-600" /> Refund Details
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={order.totalAmount}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max refundable: ₹{order.totalAmount}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Why are you initiating this refund?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="bg-yellow-50 p-3 rounded-lg flex gap-3 items-start">
                  <AlertCircle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    This action will credit the user's wallet immediately and deduct the amount from the astrologer's earnings if already settled.
                  </p>
                </div>

                <button
                  onClick={() => refundMutation.mutate()}
                  disabled={!amount || !reason || refundMutation.isPending}
                  className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}