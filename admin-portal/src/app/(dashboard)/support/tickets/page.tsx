'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Clock,
  DollarSign,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  status: string;
  userModel: string;
  userContext: {
    name: string;
    email: string;
    phone: string;
    walletBalance: number;
  };
  zohoChatUrl: string;
  requestedAmount?: number;
  refundProcessed: boolean;
  payoutApproved: boolean;
  createdAt: string;
}

interface TicketDetails extends SupportTicket {
  transaction?: any;
  payout?: any;
  previousTickets?: any[];
}

export default function SupportTicketsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('open');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null);

  // Form states
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState<'gateway' | 'wallet'>('gateway');
  const [refundReason, setRefundReason] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectType, setRejectType] = useState<'refund' | 'payout'>('refund');

  // Fetch tickets
  const { data, isLoading } = useQuery({
    queryKey: ['support-tickets', page, statusFilter, categoryFilter, userTypeFilter, searchQuery],
    queryFn: async () => {
      const response = await adminApi.getAllSupportTickets({
        page,
        limit: 20,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        userType: userTypeFilter || undefined,
        search: searchQuery || undefined,
      });
      return response.data.data;
    },
    enabled: can('support:tickets:view'),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['support-stats'],
    queryFn: async () => {
      const response = await adminApi.getSupportStats();
      return response.data.data;
    },
    enabled: can('support:stats:view'),
  });

  // Fetch ticket details
  const fetchTicketDetails = async (ticketId: string) => {
    const response = await adminApi.getSupportTicketDetails(ticketId);
    setSelectedTicket(response.data.data);
    setShowDetailsModal(true);
  };

  // Process Refund
  const refundMutation = useMutation({
    mutationFn: () =>
      adminApi.processRefund(selectedTicket!._id, {
        amount: parseFloat(refundAmount),
        refundType,
        reason: refundReason,
      }),
    onSuccess: () => {
      toast.success('Refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      setShowRefundModal(false);
      setShowDetailsModal(false);
      resetRefundForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  // Approve Payout
  const payoutMutation = useMutation({
    mutationFn: () =>
      adminApi.approvePayoutsupport(selectedTicket!._id, {
        notes: payoutNotes || undefined,
      }),
    onSuccess: () => {
      toast.success('Payout approved successfully');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      setShowPayoutModal(false);
      setShowDetailsModal(false);
      setPayoutNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve payout');
    },
  });

  // Reject Request
  const rejectMutation = useMutation({
    mutationFn: () => {
      if (rejectType === 'refund') {
        return adminApi.rejectRefund(selectedTicket!._id, { reason: rejectReason });
      } else {
        return adminApi.rejectPayoutsupport(selectedTicket!._id, { reason: rejectReason });
      }
    },
    onSuccess: () => {
      toast.success(`${rejectType === 'refund' ? 'Refund' : 'Payout'} rejected successfully`);
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-stats'] });
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setRejectReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    },
  });

  const resetRefundForm = () => {
    setRefundAmount('');
    setRefundType('gateway');
    setRefundReason('');
  };

  const columns: Column<SupportTicket>[] = [
    {
      header: 'Ticket #',
      cell: (ticket) => (
        <div>
          <span className="font-mono text-sm font-bold text-indigo-600">
            {ticket.ticketNumber}
          </span>
          <div className="text-xs text-gray-500 mt-1">
            {new Date(ticket.createdAt).toLocaleDateString()}
          </div>
        </div>
      ),
    },
    {
      header: 'User / Category',
      cell: (ticket) => (
        <div>
          <p className="font-medium text-gray-900">{ticket.userContext.name}</p>
          <p className="text-xs text-gray-500">{ticket.userContext.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
            {ticket.category.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      ),
    },
    {
      header: 'Subject',
      cell: (ticket) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">{ticket.subject}</p>
          {ticket.requestedAmount && (
            <p className="text-sm font-bold text-purple-600 mt-1">
              Amount: ₹{ticket.requestedAmount.toLocaleString()}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Type',
      cell: (ticket) => {
        const isUser = ticket.userModel === 'User';
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isUser ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {isUser ? 'User' : 'Astrologer'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      cell: (ticket) => {
        const colors: Record<string, string> = {
          open: 'bg-yellow-100 text-yellow-800',
          in_progress: 'bg-blue-100 text-blue-800',
          resolved: 'bg-green-100 text-green-800',
          closed: 'bg-gray-100 text-gray-800',
        };
        return (
          <div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[ticket.status]}`}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>
            {ticket.refundProcessed && (
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle size={12} /> Refund Processed
              </div>
            )}
            {ticket.payoutApproved && (
              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle size={12} /> Payout Approved
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (ticket) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => fetchTicketDetails(ticket._id)}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-sm"
          >
            <AlertCircle size={14} /> Details
          </button>
          <a
            href={ticket.zohoChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
          >
            <ExternalLink size={14} /> Zoho Chat
          </a>
        </div>
      ),
    },
  ];

  if (!can('support:tickets:view')) {
    return <div className="p-12 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
        <p className="text-gray-600 mt-1">Manage user and astrologer support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox
          label="Open Tickets"
          value={stats?.openTickets || 0}
          icon={Clock}
          color="text-yellow-600"
        />
        <StatBox
          label="In Progress"
          value={stats?.inProgressTickets || 0}
          icon={TrendingUp}
          color="text-blue-600"
        />
        <StatBox
          label="Refunds Pending"
          value={stats?.refundPending || 0}
          icon={DollarSign}
          color="text-purple-600"
        />
        <StatBox
          label="Payouts Pending"
          value={stats?.payoutPending || 0}
          icon={CheckCircle}
          color="text-green-600"
        />
      </div>

      <FilterBar
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Open', value: 'open' },
              { label: 'In Progress', value: 'in_progress' },
              { label: 'Resolved', value: 'resolved' },
              { label: 'Closed', value: 'closed' },
            ],
            placeholder: 'All Status',
          },
          {
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: 'Refund', value: 'refund' },
              { label: 'Payout', value: 'payout' },
              { label: 'Penalty', value: 'penalty' },
              { label: 'General', value: 'general' },
            ],
            placeholder: 'All Categories',
          },
          {
            value: userTypeFilter,
            onChange: setUserTypeFilter,
            options: [
              { label: 'Users', value: 'user' },
              { label: 'Astrologers', value: 'astrologer' },
            ],
            placeholder: 'All Types',
          },
        ]}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by ticket #, name, email..."
        onReset={() => {
          setStatusFilter('open');
          setCategoryFilter('');
          setUserTypeFilter('');
          setSearchQuery('');
        }}
      />

      <DataTable
        data={data?.tickets || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />

      {/* Details Modal */}
      {showDetailsModal && selectedTicket && (
        <Modal
          title={`Ticket #${selectedTicket.ticketNumber}`}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedTicket(null);
          }}
          size="large"
        >
          <div className="space-y-6">
            {/* User Context */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium">{selectedTicket.userContext.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium">{selectedTicket.userContext.email}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium">{selectedTicket.userContext.phone}</p>
                </div>
                <div>
                  <p className="text-gray-600">Wallet Balance</p>
                  <p className="font-medium text-green-600">
                    ₹{selectedTicket.userContext.walletBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Transaction Details (if refund) */}
            {selectedTicket.transaction && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Transaction Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Transaction ID</p>
                    <p className="font-mono text-xs">{selectedTicket.transaction.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-bold text-blue-600">
                      ₹{selectedTicket.transaction.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Payment ID</p>
                    <p className="font-mono text-xs">{selectedTicket.transaction.paymentId || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <p className="font-medium">{selectedTicket.transaction.status}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payout Details (if payout) */}
            {selectedTicket.payout && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Payout Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Payout ID</p>
                    <p className="font-mono text-xs">{selectedTicket.payout.payoutId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount</p>
                    <p className="font-bold text-green-600">₹{selectedTicket.payout.amount}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Account Number</p>
                    <p className="font-medium">{selectedTicket.payout.bankDetails?.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">IFSC Code</p>
                    <p className="font-medium">{selectedTicket.payout.bankDetails?.ifscCode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Previous Tickets */}
            {selectedTicket.previousTickets && selectedTicket.previousTickets.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Previous Tickets</h4>
                <div className="space-y-2">
                  {selectedTicket.previousTickets.map((prev: any) => (
                    <div key={prev._id} className="text-sm bg-gray-50 p-2 rounded flex justify-between">
                      <span className="font-mono">{prev.ticketNumber}</span>
                      <span className="text-gray-600">{prev.category}</span>
                      <span className={prev.status === 'resolved' ? 'text-green-600' : 'text-yellow-600'}>
                        {prev.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <a
                href={selectedTicket.zohoChatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                Open Zoho Chat
              </a>

              {selectedTicket.category === 'refund' && !selectedTicket.refundProcessed && can('support:refund:process') && (
                <>
                  <button
                    onClick={() => {
                      setRefundAmount(selectedTicket.requestedAmount?.toString() || '');
                      setShowRefundModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Process Refund
                  </button>
                  <button
                    onClick={() => {
                      setRejectType('refund');
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </>
              )}

              {selectedTicket.category === 'payout' && !selectedTicket.payoutApproved && can('support:payout:approve') && (
                <>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Approve Payout
                  </button>
                  <button
                    onClick={() => {
                      setRejectType('payout');
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedTicket && (
        <Modal
          title="Process Refund"
          onClose={() => {
            setShowRefundModal(false);
            resetRefundForm();
          }}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p>
                <span className="text-gray-600">Requested Amount:</span>{' '}
                <span className="font-bold">₹{selectedTicket.requestedAmount}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount (₹) *
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Enter refund amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refund Type *
              </label>
              <select
                value={refundType}
                onChange={(e) => setRefundType(e.target.value as 'gateway' | 'wallet')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="gateway">Payment Gateway (Original Payment Method)</option>
                <option value="wallet">Wallet Credit (Bonus Balance)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {refundType === 'gateway'
                  ? 'Refunds to original payment method via Razorpay'
                  : 'Credits to user wallet as bonus (non-withdrawable)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Enter reason for refund..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => refundMutation.mutate()}
                disabled={!refundAmount || !refundReason || refundMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {refundMutation.isPending ? 'Processing...' : 'Process Refund'}
              </button>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  resetRefundForm();
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Approve Payout Modal */}
      {showPayoutModal && selectedTicket && (
        <Modal title="Approve Payout" onClose={() => setShowPayoutModal(false)}>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p>
                <span className="text-gray-600">Payout Amount:</span>{' '}
                <span className="font-bold text-green-600">₹{selectedTicket.payout?.amount}</span>
              </p>
              <p className="mt-2">
                <span className="text-gray-600">Astrologer:</span>{' '}
                <span className="font-medium">{selectedTicket.userContext.name}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approval Notes (optional)
              </label>
              <textarea
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Add any notes about this payout approval..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => payoutMutation.mutate()}
                disabled={payoutMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {payoutMutation.isPending ? 'Approving...' : 'Approve Payout'}
              </button>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTicket && (
        <Modal
          title={`Reject ${rejectType === 'refund' ? 'Refund' : 'Payout'} Request`}
          onClose={() => {
            setShowRejectModal(false);
            setRejectReason('');
          }}
        >
          <div className="space-y-4">
            <div className="bg-red-50 p-3 rounded text-sm text-red-800">
              <p className="font-medium">
                You are about to reject this {rejectType} request. This action cannot be undone.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Explain why this request is being rejected..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={!rejectReason || rejectMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
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

function StatBox({ label, value, icon: Icon, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {Icon && <Icon className={`${color} mt-1`} size={20} />}
    </div>
  );
}

function Modal({ title, children, onClose, size = 'default' }: { title: string; children: React.ReactNode; onClose: () => void; size?: 'default' | 'large' }) {
  const sizeClasses = {
    default: 'max-w-md',
    large: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl p-6 ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
