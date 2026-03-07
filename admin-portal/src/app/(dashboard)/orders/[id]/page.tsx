'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Star, Clock, Coins, RefreshCw, XCircle, X,
  Video, MessageCircle, Phone, FileText, CheckCircle, AlertCircle, PlayCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import type { Order } from '@/types/order';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id as string;
  const { can } = usePermission();

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [zohoTicketId, setZohoTicketId] = useState('');

  const [viewingChatSessionId, setViewingChatSessionId] = useState<string | null>(null);

  // Fetch Order
  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      const response = await adminApi.getOrderDetails(orderId);
      const orderData = response.data.data;
      setRefundAmount(orderData.totalAmount?.toString() || '0');
      return orderData;
    },
  });

  // Cancel Mutation
  const cancelMutation = useMutation({
    mutationFn: () => adminApi.cancelOrder(order?.orderId!, cancelReason),
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

  // Refund Mutation
  const refundMutation = useMutation({
    mutationFn: () =>
      adminApi.refundOrder(order?.orderId!, {
        amount: parseFloat(refundAmount),
        reason: refundReason,
        zohoTicketId: zohoTicketId,
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

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide cancellation reason');
      return;
    }
    cancelMutation.mutate();
  };

  const handleRefund = () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }
    if (parseFloat(refundAmount) > (order?.totalAmount || 0)) {
      toast.error('Refund amount cannot exceed order total');
      return;
    }
    refundMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageCircle size={16} />;
      case 'call': return <Phone size={16} />;
      case 'video_call': return <Video size={16} />;
      default: return <FileText size={16} />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Orders
        </button>
      </div>

      {/* Main Order Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900">{order.orderId}</h2>
              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm capitalize">
                {getTypeIcon(order.type)} {order.type}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              {order.refundRequest && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${order.refundRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  order.refundRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                  Refund {order.refundRequest.status}
                </span>
              )}
            </div>
          </div>
          <div className="text-right text-sm text-gray-500 space-y-1">
            <p>Created: {new Date(order.createdAt).toLocaleString()}</p>
            {order.startedAt && <p>Started: {new Date(order.startedAt).toLocaleString()}</p>}
            {order.endedAt && <p>Ended: {new Date(order.endedAt).toLocaleString()}</p>}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Amount (1 Cr = 1 ₹)" value={`${order.totalAmount.toLocaleString()} Cr`} icon={Coins} color="text-green-600" />
          <StatCard label="Rate/Min" value={`${order.ratePerMinute} Cr`} icon={Clock} />
          <StatCard label="Duration" value={formatDuration(order.actualDurationSeconds)} icon={Clock} />
          <StatCard label="Payment" value={order.payment.status} icon={CheckCircle} color={getPaymentStatusColor(order.payment.status)} />
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Coins size={20} /> Payment Breakdown
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          <PaymentDetail label="Held Amount" value={`${order.payment.heldAmount} Cr`} timestamp={order.payment.heldAt} />
          <PaymentDetail label="Charged Amount" value={`${order.payment.chargedAmount} Cr`} timestamp={order.payment.chargedAt} />
          <PaymentDetail label="Refunded Amount" value={`${order.payment.refundedAmount} Cr`} timestamp={order.payment.refundedAt} />
        </div>
        {order.payment.transactionId && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <span className="font-medium">Transaction ID:</span> {order.payment.transactionId}
          </div>
        )}
      </div>

      {/* Session History (With Enhanced Recording Link) */}
      {order.sessionHistory && order.sessionHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session History ({order.sessionHistory.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Session ID</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Start</th>
                  <th className="px-4 py-3 text-left">End</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Billed</th>
                  <th className="px-4 py-3 text-left">Charged</th>
                  <th className="px-4 py-3 text-left">Recording</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.sessionHistory.map((session, idx) => (
                  <tr key={session.sessionId || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{session.sessionId.slice(-8)}</td>
                    <td className="px-4 py-3 capitalize">{session.sessionType}</td>
                    <td className="px-4 py-3">{new Date(session.startedAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3">{new Date(session.endedAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3">{formatDuration(session.durationSeconds)}</td>
                    <td className="px-4 py-3">{session.billedMinutes} min</td>
                    <td className="px-4 py-3">{session.chargedAmount} Cr</td>
                    <td className="px-4 py-3">
                      {session.sessionType === 'chat' ? (
                        <button
                          onClick={() => setViewingChatSessionId(session.sessionId)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <MessageCircle size={16} />
                          View Chat
                        </button>
                      ) : session.recordingUrl ? (
                        <a
                          href={session.recordingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          <PlayCircle size={16} />
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs italic">No Recording</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Participants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ParticipantCard
          title="User"
          icon={User}
          data={[
            { label: 'Name', value: order.userId?.name || 'N/A' },
            { label: 'Phone', value: order.userId?.phoneNumber || 'N/A' },
            { label: 'Email', value: order.userId?.email || 'Not provided' },
          ]}
        />
        <ParticipantCard
          title="Astrologer"
          icon={Star}
          data={[
            { label: 'Name', value: order.astrologerId?.name || 'N/A' },
            { label: 'Phone', value: order.astrologerId?.phoneNumber || 'N/A' },
            { label: 'Experience', value: order.astrologerId?.experienceYears ? `${order.astrologerId.experienceYears} years` : 'N/A' },
          ]}
        />
      </div>

      {/* Refund Request Info */}
      {order.refundRequest && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <AlertCircle size={20} /> Refund Request
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Status:</span> <span className="capitalize">{order.refundRequest.status}</span></div>
            <div><span className="font-medium">Requested:</span> {new Date(order.refundRequest.requestedAt).toLocaleString()}</div>
            <div><span className="font-medium">Reason:</span> {order.refundRequest.reason}</div>
            {order.refundRequest.refundAmount && <div><span className="font-medium">Amount:</span> {order.refundRequest.refundAmount} Cr</div>}
            {order.refundRequest.adminNotes && <div className="col-span-2"><span className="font-medium">Admin Notes:</span> {order.refundRequest.adminNotes}</div>}
            {order.refundRequest.rejectionReason && <div className="col-span-2 text-red-700"><span className="font-medium">Rejection:</span> {order.refundRequest.rejectionReason}</div>}
          </div>
        </div>
      )}

      {/* Review Section */}
      {order.reviewSubmitted && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Star size={20} className="text-yellow-500" /> User Review
          </h3>
          <div className="flex items-center gap-2 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={16} fill={i < (order.rating || 0) ? 'gold' : 'none'} className="text-yellow-500" />
            ))}
            <span className="text-sm text-gray-600">({order.rating}/5)</span>
          </div>
          {order.review && <p className="text-gray-700 italic">"{order.review}"</p>}
          <p className="text-xs text-gray-400 mt-2">Submitted: {order.reviewSubmittedAt && new Date(order.reviewSubmittedAt).toLocaleString()}</p>
        </div>
      )}

      {/* Action Buttons */}
      {can('manage_refunds') && (order.status === 'completed' || order.status === 'pending') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Actions</h3>
          <div className="flex gap-3">
            {order.status === 'completed' && (
              <button
                onClick={() => setShowRefundModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <RefreshCw size={18} />
                Process Refund
              </button>
            )}
            {order.status === 'pending' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <XCircle size={18} />
                Cancel Order
              </button>
            )}
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <Modal title="Process Refund" onClose={() => setShowRefundModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount</label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={order.totalAmount}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Max: {order.totalAmount.toLocaleString()} Cr</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zoho Ticket Reference</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
                <input
                  type="text"
                  value={zohoTicketId}
                  onChange={(e) => setZohoTicketId(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="987654321"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Link this refund to the support ticket ID</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Explain why this refund is being processed..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefund}
                disabled={refundMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
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

      {/* Cancel Modal */}
      {showCancelModal && (
        <Modal title="Cancel Order" onClose={() => setShowCancelModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Provide reason for cancellation..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {viewingChatSessionId && (
        <ChatViewerModal
          sessionId={viewingChatSessionId}
          onClose={() => setViewingChatSessionId(null)}
        />
      )}
    </div>
  );
}

function ChatViewerModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-chat-messages', sessionId],
    queryFn: async () => {
      const response = await adminApi.getChatMessages(sessionId);
      // Adjust path based on your API response structure
      return response.data?.data?.messages || response.data?.data || [];
    },
    refetchInterval: 5000 // Automatically fetch new messages every 5s for live monitoring
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b flex justify-between items-center z-10">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="text-blue-600" size={20} />
              Security & Fraud Monitoring
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1">Session ID: {sessionId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Chat Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages?.length > 0 ? (
            messages.map((msg: any) => {
              // Automatically detects sender regardless of schema variations
              const isUser = msg.senderType === 'User' || msg.senderModel === 'User' || msg.sender === 'user';

              return (
                <div key={msg._id || msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] ${isUser
                    ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                    : 'bg-white border shadow-sm rounded-tl-sm text-gray-800'
                    }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content || msg.message}</p>
                    <span className={`text-[10px] mt-1 block font-medium ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                      {isUser ? 'User' : 'Astrologer'} • {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center flex-col text-gray-400 gap-2">
              <MessageCircle size={40} className="opacity-20" />
              <p>No messages recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    ongoing: 'bg-blue-100 text-blue-800',
    active: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    waiting: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color = 'text-gray-900' }: any) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
      <Icon className={color} size={20} />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function PaymentDetail({ label, value, timestamp }: { label: string; value: string; timestamp?: string }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      {timestamp && <p className="text-xs text-gray-400 mt-1">{new Date(timestamp).toLocaleString()}</p>}
    </div>
  );
}

function ParticipantCard({ title, icon: Icon, data }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon size={20} /> {title}
      </h3>
      <dl className="space-y-2">
        {data.map((item: any) => (
          <div key={item.label} className="flex justify-between text-sm">
            <dt className="text-gray-500">{item.label}:</dt>
            <dd className="text-gray-900 font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function getPaymentStatusColor(status: string) {
  const colors: Record<string, string> = {
    charged: 'text-green-600',
    hold: 'text-yellow-600',
    refunded: 'text-purple-600',
    failed: 'text-red-600',
  };
  return colors[status] || 'text-gray-600';
}