'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, Star, Clock, DollarSign, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const cancelMutation = useMutation({
  mutationFn: () => adminApi.cancelOrder(order?.orderId, cancelReason),
  onSuccess: () => {
    toast.success('Order cancelled successfully');
    queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
    setShowCancelModal(false);
    setCancelReason('');
  },
  onError: (error: any) => {
    toast.error(error.response?.data?.message || 'Failed to cancel order');
  },
});

const handleCancel = () => {
  if (!cancelReason.trim()) {
    toast.error('Please provide cancellation reason');
    return;
  }
  cancelMutation.mutate();
};

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      const response = await adminApi.getOrderDetails(orderId);
      setRefundAmount(response.data.data.totalAmount.toString());
      return response.data.data;
    },
  });

  const refundMutation = useMutation({
    mutationFn: () =>
      adminApi.refundOrder(order?.orderId, {
        amount: parseFloat(refundAmount),
        reason: refundReason,
      }),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      setShowRefundModal(false);
      setRefundReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  const handleRefund = () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }
    refundMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Orders
        </button>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <p className="text-gray-500">Order ID: {order?.orderId}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order?.status)}`}>
            {order?.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-xl font-bold text-gray-900">₹{order?.totalAmount?.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="text-purple-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-xl font-bold text-gray-900">
                {order?.session?.durationMinutes || 0} mins
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <RefreshCw className="text-green-600" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-xl font-bold text-gray-900 capitalize">{order?.type}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <User className="text-gray-400" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">User Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900 font-medium">{order?.userId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{order?.userId?.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{order?.userId?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Astrologer Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="text-gray-400" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Astrologer Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="text-gray-900 font-medium">{order?.astrologerId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{order?.astrologerId?.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{order?.astrologerId?.email || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div>
              <p className="font-medium text-gray-900">Order Created</p>
              <p className="text-sm text-gray-500">
                {new Date(order?.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {order?.session?.startTime && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Session Started</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.session.startTime).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {order?.session?.endTime && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              </div>
              <div>
                <p className="font-medium text-gray-900">Session Ended</p>
                <p className="text-sm text-gray-500">
                  {new Date(order.session.endTime).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {(order?.status === 'completed' || order?.status === 'pending') && (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
    <div className="flex space-x-3">
      {order?.status === 'completed' && (
        <button
          onClick={() => setShowRefundModal(true)}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw size={18} className="mr-2" />
          Process Refund
        </button>
      )}
      {order?.status === 'pending' && (
        <button
          onClick={() => setShowCancelModal(true)}
          className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          <XCircle size={18} className="mr-2" />
          Cancel Order
        </button>
      )}
    </div>
  </div>
)}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Refund</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter amount"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum: ₹{order?.totalAmount?.toLocaleString()}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Reason *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Provide reason for refund..."
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleRefund}
                disabled={refundMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {refundMutation.isPending ? 'Processing...' : 'Confirm Refund'}
              </button>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
{showCancelModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Cancel Order</h3>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cancellation Reason *
        </label>
        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="Provide reason for cancellation..."
          required
        />
      </div>
      <div className="flex space-x-3">
        <button
          onClick={handleCancel}
          disabled={cancelMutation.isPending}
          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
        >
          {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
        </button>
        <button
          onClick={() => {
            setShowCancelModal(false);
            setCancelReason('');
          }}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
