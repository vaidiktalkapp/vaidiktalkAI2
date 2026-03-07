// app/(dashboard)/payouts/page.tsx

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  Eye,
  Download,
  Search,
  AlertTriangle,
  FileText,
  Building2,
  User,
  Calendar,
  Coins,
  TrendingUp,
  CheckCheck,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName?: string;
  upiId?: string;
}

interface Payout {
  _id: string;
  payoutId: string;
  astrologerId: {
    _id: string;
    name: string;
    phoneNumber: string;
    email?: string;
  };
  amount: number;
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  bankDetails: BankDetails;
  createdAt: string;
  approvedAt?: string;
  processedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  transactionReference?: string;
  rejectionReason?: string;
  adminNotes?: string;
  metadata?: any;
}

export default function PayoutsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const { can } = usePermission();
  const queryClient = useQueryClient();

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  // Form states
  const [approveRef, setApproveRef] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [processRef, setProcessRef] = useState('');
  const [processNotes, setProcessNotes] = useState('');
  const [completeRef, setCompleteRef] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // Fetch payouts
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payouts', page, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getAllPayouts({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      return response.data.data;
    },
    enabled: can('view_payouts'),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['payout-stats'],
    queryFn: async () => {
      const response = await adminApi.getPayoutStats();
      return response.data.data;
    },
    enabled: can('view_payouts'),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: () => adminApi.approvePayout(selectedPayout!.payoutId, {
      transactionReference: approveRef,
      adminNotes: approveNotes,
    }),
    onSuccess: () => {
      toast.success('Payout approved successfully');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      closeAllModals();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve payout');
    },
  });

  // Process mutation (new)
  const processMutation = useMutation({
    mutationFn: () => adminApi.processPayout(selectedPayout!.payoutId, {
      transactionReference: processRef,
      adminNotes: processNotes,
    }),
    onSuccess: () => {
      toast.success('Payout marked as processing');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      closeAllModals();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payout');
    },
  });

  // Complete mutation (new)
  const completeMutation = useMutation({
    mutationFn: () => adminApi.completePayout(selectedPayout!.payoutId, {
      transactionReference: completeRef,
      adminNotes: completeNotes,
    }),
    onSuccess: () => {
      toast.success('Payout completed! Amount deducted from astrologer balance.');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      closeAllModals();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete payout');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectPayout(selectedPayout!.payoutId, rejectReason),
    onSuccess: () => {
      toast.success('Payout rejected');
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['payout-stats'] });
      closeAllModals();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject payout');
    },
  });

  const closeAllModals = () => {
    setShowDetailsModal(false);
    setShowApproveModal(false);
    setShowProcessModal(false);
    setShowCompleteModal(false);
    setShowRejectModal(false);
    setSelectedPayout(null);
    setApproveNotes('');
    setProcessRef('');
    setProcessNotes('');
    setCompleteRef('');
    setCompleteNotes('');
    setRejectReason('');
    setApproveRef('');
  };

  const openDetailsModal = (payout: Payout) => {
    setSelectedPayout(payout);
    setShowDetailsModal(true);
  };

  const columns: Column<Payout>[] = [
    {
      header: 'Payout ID',
      cell: (payout) => (
        <div className="space-y-1">
          <span className="font-mono text-xs font-medium text-gray-900">
            {payout.payoutId}
          </span>
          <p className="text-xs text-gray-500">
            {new Date(payout.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      ),
    },
    {
      header: 'Astrologer',
      cell: (payout) => (
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
            {payout.astrologerId?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{payout.astrologerId?.name}</p>
            <p className="text-xs text-gray-500">{payout.astrologerId?.phoneNumber}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (payout) => (
        <div className="text-right">
          <p className="text-lg font-bold text-green-600">
            {payout.amount.toLocaleString('en-IN')} Cr
          </p>
        </div>
      ),
    },
    {
      header: 'Bank Details',
      cell: (payout) => (
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">
            {payout.bankDetails?.accountHolderName}
          </p>
          <p className="text-xs text-gray-500">
            {payout.bankDetails?.bankName || 'Bank'} • **** {payout.bankDetails?.accountNumber?.slice(-4)}
          </p>
          {payout.bankDetails?.ifscCode && (
            <p className="text-xs text-gray-400">IFSC: {payout.bankDetails.ifscCode}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (payout) => <StatusBadge status={payout.status} />,
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (payout) => (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => openDetailsModal(payout)}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
            title="View Details"
          >
            <Eye size={18} />
          </button>

          {payout.status === 'pending' && can('approve_payouts') && (
            <>
              <button
                onClick={() => { setSelectedPayout(payout); setShowApproveModal(true); }}
                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                title="Approve"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => { setSelectedPayout(payout); setShowRejectModal(true); }}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                title="Reject"
              >
                <XCircle size={18} />
              </button>
            </>
          )}

          {payout.status === 'approved' && can('approve_payouts') && (
            <button
              onClick={() => { setSelectedPayout(payout); setShowProcessModal(true); }}
              className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
              title="Mark as Processing"
            >
              <ArrowRight size={18} />
            </button>
          )}

          {payout.status === 'processing' && can('approve_payouts') && (
            <button
              onClick={() => { setSelectedPayout(payout); setShowCompleteModal(true); }}
              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
              title="Mark as Completed"
            >
              <CheckCheck size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!can('view_payouts')) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Ban className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">You don't have permission to view payouts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payout Management</h1>
          <p className="text-gray-600 mt-1">Review and process astrologer withdrawal requests (1 Credit = 1 ₹)</p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Requests"
          value={stats?.total || 0}
          icon={FileText}
          color="blue"
        />
        <StatCard
          label="Pending"
          value={stats?.pending || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          label="Approved"
          value={stats?.approved || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          label="Rejected"
          value={stats?.rejected || 0}
          icon={XCircle}
          color="red"
        />
        <StatCard
          label="Total Amount (1 Cr = 1 ₹)"
          value={`${((stats?.totalAmount || 0) / 1000).toFixed(1)}K Cr`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by Payout ID or Astrologer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={data?.payouts || []}
          columns={columns}
          isLoading={isLoading}
          pagination={{
            page,
            totalPages: data?.pagination?.pages || 1,
            onPageChange: setPage,
          }}
        />
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayout && (
        <PayoutDetailsModal
          payout={selectedPayout}
          onClose={closeAllModals}
          onApprove={() => { setShowDetailsModal(false); setShowApproveModal(true); }}
          onProcess={() => { setShowDetailsModal(false); setShowProcessModal(true); }}
          onComplete={() => { setShowDetailsModal(false); setShowCompleteModal(true); }}
          onReject={() => { setShowDetailsModal(false); setShowRejectModal(true); }}
          canApprove={can('approve_payouts')}
          canProcess={can('approve_payouts')}
        />
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedPayout && (
        <ActionModal
          title="Approve Payout"
          icon={<CheckCircle className="text-green-600" size={24} />}
          payout={selectedPayout}
          onClose={closeAllModals}
          onConfirm={() => approveMutation.mutate()}
          isLoading={approveMutation.isPending}
          confirmText="Approve Payout"
          confirmColor="green"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                This will mark the payout as <strong>approved</strong>. You can then process the bank transfer.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Reference
              </label>
              <input
                type="text"
                value={approveRef}
                onChange={(e) => setApproveRef(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg
               focus:ring-2 focus:ring-green-500"
                placeholder="UTR / Transaction ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Add any notes..."
              />
            </div>
          </div>
        </ActionModal>
      )}

      {/* Process Modal */}
      {showProcessModal && selectedPayout && (
        <ActionModal
          title="Mark as Processing"
          icon={<ArrowRight className="text-purple-600" size={24} />}
          payout={selectedPayout}
          onClose={closeAllModals}
          onConfirm={() => processMutation.mutate()}
          isLoading={processMutation.isPending}
          confirmText="Start Processing"
          confirmColor="purple"
        >
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                Mark this payout as <strong>processing</strong> after initiating the bank transfer.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Transaction Reference (Optional)
              </label>
              <input
                type="text"
                value={processRef}
                onChange={(e) => setProcessRef(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="UTR/Transaction ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Add any notes..."
              />
            </div>
          </div>
        </ActionModal>
      )}

      {/* Complete Modal */}
      {showCompleteModal && selectedPayout && (
        <ActionModal
          title="Complete Payout"
          icon={<CheckCheck className="text-blue-600" size={24} />}
          payout={selectedPayout}
          onClose={closeAllModals}
          onConfirm={() => completeMutation.mutate()}
          isLoading={completeMutation.isPending}
          confirmText="Complete Payout"
          confirmColor="blue"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>⚠️ Important:</strong> This will deduct {selectedPayout.amount.toLocaleString()} Cr from the astrologer's withdrawable balance.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Transaction Reference <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={completeRef}
                onChange={(e) => setCompleteRef(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="UTR Number / Transaction ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Completion Notes (Optional)
              </label>
              <textarea
                value={completeNotes}
                onChange={(e) => setCompleteNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add completion notes..."
              />
            </div>
          </div>
        </ActionModal>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayout && (
        <ActionModal
          title="Reject Payout"
          icon={<XCircle className="text-red-600" size={24} />}
          payout={selectedPayout}
          onClose={closeAllModals}
          onConfirm={() => rejectMutation.mutate()}
          isLoading={rejectMutation.isPending}
          confirmText="Reject Payout"
          confirmColor="red"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Please provide a clear reason for rejecting this payout request.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Explain why this payout is being rejected..."
                required
              />
            </div>
          </div>
        </ActionModal>
      )}
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: 'yellow', icon: Clock, label: 'Pending Review' },
    approved: { color: 'green', icon: CheckCircle, label: 'Approved' },
    processing: { color: 'purple', icon: ArrowRight, label: 'Processing' },
    completed: { color: 'blue', icon: CheckCheck, label: 'Completed' },
    rejected: { color: 'red', icon: XCircle, label: 'Rejected' },
  }[status] || { color: 'gray', icon: AlertTriangle, label: status };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
      bg-${config.color}-100 text-${config.color}-800 border border-${config.color}-200`}>
      <Icon size={14} />
      {config.label}
    </span>
  );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: 'blue' | 'yellow' | 'green' | 'red' | 'purple' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

// Payout Details Modal Component
function PayoutDetailsModal({ payout, onClose, onApprove, onProcess, onComplete, onReject, canApprove, canProcess }: any) {
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');

  // Fetch Financial Audit
  const { data: audit, isLoading: loadingAudit } = useQuery({
    queryKey: ['payout-audit', payout.payoutId],
    queryFn: async () => {
      const response = await adminApi.getPayoutFinancialAudit(payout.payoutId);
      return response.data.data;
    },
    enabled: activeTab === 'audit',
  });

  return (
    <Modal title="Payout Request Details" onClose={onClose} size="large">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Request Details
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'audit' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          Earnings Audit
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'details' ? (
          <>
            {/* Amount Card */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
              <p className="text-sm opacity-90">Payout Amount</p>
              <p className="text-4xl font-bold mt-2">{payout.amount.toLocaleString('en-IN')} Cr</p>
              <div className="mt-4">
                <StatusBadge status={payout.status} />
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoCard icon={FileText} label="Payout ID" value={payout.payoutId} />
              <InfoCard
                icon={Calendar}
                label="Requested On"
                value={new Date(payout.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              />
            </div>

            {/* Astrologer Info */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                  {payout.astrologerId?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{payout.astrologerId?.name}</p>
                  <p className="text-sm text-gray-600">{payout.astrologerId?.phoneNumber}</p>
                  {payout.astrologerId?.email && (
                    <p className="text-xs text-gray-500">{payout.astrologerId.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="text-gray-600" size={20} />
                <h4 className="font-semibold text-gray-900">Bank Account Details</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Holder:</span>
                  <span className="font-medium">{payout.bankDetails?.accountHolderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bank Name:</span>
                  <span className="font-medium">{payout.bankDetails?.bankName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Account Number:</span>
                  <span className="font-mono font-medium">{payout.bankDetails?.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IFSC Code:</span>
                  <span className="font-mono font-medium">{payout.bankDetails?.ifscCode}</span>
                </div>
                {payout.bankDetails?.upiId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">UPI ID:</span>
                    <span className="font-medium">{payout.bankDetails.upiId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Reference */}
            {payout.transactionReference && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 font-medium">Transaction Reference</p>
                <p className="text-blue-900 font-mono mt-1">{payout.transactionReference}</p>
              </div>
            )}

            {/* Admin Notes */}
            {payout.adminNotes && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-medium">Admin Notes</p>
                <p className="text-gray-900 mt-1">{payout.adminNotes}</p>
              </div>
            )}

            {/* Rejection Reason */}
            {payout.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 font-medium">Rejection Reason</p>
                <p className="text-red-900 mt-1">{payout.rejectionReason}</p>
              </div>
            )}

            {/* Timeline */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Status Timeline</h4>
              <div className="space-y-3">
                <TimelineItem
                  label="Request Created"
                  date={payout.createdAt}
                  completed={true}
                />
                {payout.approvedAt && (
                  <TimelineItem
                    label="Approved"
                    date={payout.approvedAt}
                    completed={true}
                  />
                )}
                {payout.processedAt && (
                  <TimelineItem
                    label="Processing"
                    date={payout.processedAt}
                    completed={true}
                  />
                )}
                {payout.completedAt && (
                  <TimelineItem
                    label="Completed"
                    date={payout.completedAt}
                    completed={true}
                  />
                )}
                {payout.rejectedAt && (
                  <TimelineItem
                    label="Rejected"
                    date={payout.rejectedAt}
                    completed={true}
                    isRejected={true}
                  />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {payout.status === 'pending' && canApprove && (
                <>
                  <button
                    onClick={onApprove}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    Approve Payout
                  </button>
                  <button
                    onClick={onReject}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    Reject
                  </button>
                </>
              )}

              {payout.status === 'approved' && canProcess && (
                <button
                  onClick={onProcess}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Mark as Processing
                </button>
              )}

              {payout.status === 'processing' && canProcess && (
                <button
                  onClick={onComplete}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Complete Payout
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {!audit && loadingAudit ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : audit ? (
              <>
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                    <p className="text-sm text-green-700 font-medium">Earned (Orders)</p>
                    <p className="text-2xl font-bold text-green-900 mt-1">{audit.summary.totalOrderRevenue} Cr</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <p className="text-sm text-red-700 font-medium">Refund Loss</p>
                    <p className="text-2xl font-bold text-red-900 mt-1">{audit.summary.totalRefundLoss} Cr</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <p className="text-sm text-yellow-700 font-medium">Penalty Loss</p>
                    <p className="text-2xl font-bold text-yellow-900 mt-1">{audit.summary.totalPenaltyLoss} Cr</p>
                  </div>
                </div>

                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded text-center">
                  Audit Period: {new Date(audit.auditWindow.from).toLocaleDateString()} to {new Date(audit.auditWindow.to).toLocaleDateString()}
                </div>

                {/* Audit Tables */}
                <div className="space-y-6">
                  {/* Completed Orders */}
                  {audit.records.completedOrders?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-500" /> Completed Orders ({audit.records.completedOrders.length})
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-500">Order ID</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-500">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {audit.records.completedOrders.map((order: any) => (
                              <tr key={order.orderId}>
                                <td className="px-4 py-2 font-mono text-xs">{order.orderId}</td>
                                <td className="px-4 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-2 capitalize">{order.type}</td>
                                <td className="px-4 py-2 text-right font-medium text-green-600">{order.totalAmount} Cr</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Refunds */}
                  {audit.records.refundedOrders?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <TrendingUp size={18} className="text-red-500" /> Refunded Orders ({audit.records.refundedOrders.length})
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-500">Order ID</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-500">Refund Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {audit.records.refundedOrders.map((order: any) => (
                              <tr key={order.orderId}>
                                <td className="px-4 py-2 font-mono text-xs">{order.orderId}</td>
                                <td className="px-4 py-2">{new Date(order.createdAt).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-right font-medium text-red-600">-{order.refundRequest?.refundAmount} Cr</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Penalties */}
                  {audit.records.penalties?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-yellow-500" /> Applied Penalties ({audit.records.penalties.length})
                      </h4>
                      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                              <th className="px-4 py-2 text-left font-medium text-gray-500">Reason</th>
                              <th className="px-4 py-2 text-right font-medium text-gray-500">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 bg-white">
                            {audit.records.penalties.map((penalty: any) => (
                              <tr key={penalty._id}>
                                <td className="px-4 py-2">{new Date(penalty.appliedAt).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-gray-600">{penalty.reason}</td>
                                <td className="px-4 py-2 text-right font-medium text-yellow-600">-{penalty.amount} Cr</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {audit.records.completedOrders?.length === 0 && audit.records.refundedOrders?.length === 0 && audit.records.penalties?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No financial activity found in this audit window.
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="flex justify-center p-8 text-red-500">Failed to load audit data.</div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Info Card Component
function InfoCard({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <Icon className="text-gray-600 mt-0.5" size={18} />
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// Timeline Item Component
function TimelineItem({ label, date, completed, isRejected = false }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 w-2 h-2 rounded-full ${completed ? (isRejected ? 'bg-red-500' : 'bg-green-500') : 'bg-gray-300'}`} />
      <div className="flex-1">
        <p className={`text-sm font-medium ${completed ? (isRejected ? 'text-red-900' : 'text-gray-900') : 'text-gray-500'}`}>
          {label}
        </p>
        {date && (
          <p className="text-xs text-gray-500 mt-0.5">
            {new Date(date).toLocaleString('en-IN')}
          </p>
        )}
      </div>
    </div>
  );
}

// Action Modal Component
function ActionModal({ title, icon, payout, children, onClose, onConfirm, isLoading, confirmText, confirmColor }: { title: string; icon: React.ReactNode; payout: Payout; children: React.ReactNode; onClose: () => void; onConfirm: () => void; isLoading: boolean; confirmText: string; confirmColor: 'green' | 'purple' | 'blue' | 'red' }) {
  const colors = {
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    red: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          {icon}
          <div>
            <p className="text-sm text-gray-600">Payout ID: <span className="font-mono font-medium">{payout.payoutId}</span></p>
            <p className="text-lg font-bold text-gray-900">{payout.amount.toLocaleString('en-IN')} Cr</p>
            <p className="text-sm text-gray-600">{payout.astrologerId?.name}</p>
          </div>
        </div>

        {/* Content */}
        {children}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${colors[confirmColor]}`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Modal Component
function Modal({ title, children, onClose, size = 'default' }: { title: string; children: React.ReactNode; onClose: () => void; size?: 'default' | 'large' }) {
  const sizes = {
    default: 'max-w-md',
    large: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl p-6 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          >
            <XCircle size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
