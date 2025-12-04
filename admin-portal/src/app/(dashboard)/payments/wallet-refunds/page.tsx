'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import { CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface WalletRefund {
  _id: string;
  refundId: string;
  userId: { name: string; phoneNumber: string };
  requestedAmount: number;
  status: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
  };
  requestedAt: string;
  processedAt?: string;
}

export default function WalletRefundsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const { can } = usePermission();
  const queryClient = useQueryClient();

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<WalletRefund | null>(null);
  const [approvedAmount, setApprovedAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-refunds', page, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getWalletRefundRequests({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      return response.data.data;
    },
    enabled: can('view_payments'),
  });

  const processMutation = useMutation({
    mutationFn: () => adminApi.processWalletRefund(selectedRefund!.refundId, {
      amountApproved: parseFloat(approvedAmount),
      paymentReference: paymentRef,
    }),
    onSuccess: () => {
      toast.success('Wallet refund processed successfully');
      queryClient.invalidateQueries({ queryKey: ['wallet-refunds'] });
      setShowProcessModal(false);
      setApprovedAmount('');
      setPaymentRef('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process refund');
    },
  });

  const columns: Column<WalletRefund>[] = [
    {
      header: 'Refund ID',
      cell: (refund) => <span className="font-mono text-xs">{refund.refundId}</span>,
    },
    {
      header: 'User',
      cell: (refund) => (
        <div>
          <p className="font-medium text-gray-900">{refund.userId?.name}</p>
          <p className="text-xs text-gray-500">{refund.userId?.phoneNumber}</p>
        </div>
      ),
    },
    {
      header: 'Amount',
      cell: (refund) => <span className="font-bold text-purple-600">₹{refund.requestedAmount.toLocaleString()}</span>,
    },
    {
      header: 'Bank Details',
      cell: (refund) => (
        <div className="text-xs text-gray-600">
          <p>A/c: {refund.bankDetails?.accountNumber || 'N/A'}</p>
          <p>IFSC: {refund.bankDetails?.ifscCode || 'N/A'}</p>
          <p className="font-medium">{refund.bankDetails?.accountHolderName || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (refund) => {
        const colors: Record<string, string> = {
          pending: 'bg-yellow-100 text-yellow-800',
          approved: 'bg-green-100 text-green-800',
          rejected: 'bg-red-100 text-red-800',
          completed: 'bg-blue-100 text-blue-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[refund.status]}`}>
            {refund.status}
          </span>
        );
      },
    },
    {
      header: 'Requested',
      cell: (refund) => new Date(refund.requestedAt).toLocaleString(),
      className: 'text-gray-500 text-sm',
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (refund) => (
        refund.status === 'pending' && can('manage_refunds') && (
          <button
            onClick={() => {
              setSelectedRefund(refund);
              setApprovedAmount(refund.requestedAmount.toString());
              setShowProcessModal(true);
            }}
            className="text-green-600 hover:text-green-800 flex items-center gap-1 justify-end"
          >
            <CheckCircle size={16} /> Process
          </button>
        )
      ),
    },
  ];

  if (!can('view_payments')) {
    return <div className="p-12 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Wallet Refunds</h1>
        <p className="text-gray-600 mt-1">Process user wallet withdrawal requests</p>
      </div>

      <FilterBar
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Completed', value: 'completed' },
              { label: 'Rejected', value: 'rejected' },
            ],
            placeholder: 'All Status',
          },
        ]}
        onReset={() => setStatusFilter('pending')}
      />

      <DataTable
        data={data?.requests || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />

      {/* Process Modal */}
      {showProcessModal && selectedRefund && (
        <Modal title="Process Wallet Refund" onClose={() => setShowProcessModal(false)}>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm"><span className="text-gray-600">User:</span> <span className="font-medium">{selectedRefund.userId?.name}</span></p>
              <p className="text-sm"><span className="text-gray-600">Phone:</span> <span className="font-medium">{selectedRefund.userId?.phoneNumber}</span></p>
              <p className="text-sm"><span className="text-gray-600">Requested:</span> <span className="font-bold text-purple-600">₹{selectedRefund.requestedAmount}</span></p>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs text-gray-600">Bank Details:</p>
                <p className="text-sm font-medium">{selectedRefund.bankDetails?.accountHolderName}</p>
                <p className="text-xs text-gray-600">A/c: {selectedRefund.bankDetails?.accountNumber}</p>
                <p className="text-xs text-gray-600">IFSC: {selectedRefund.bankDetails?.ifscCode}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approved Amount (₹) *</label>
              <input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Enter approved amount"
              />
              <p className="text-xs text-gray-500 mt-1">Can be less than requested if deductions apply</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Reference *</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Bank/UPI transaction ID"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => processMutation.mutate()}
                disabled={!approvedAmount || !paymentRef || processMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processMutation.isPending ? 'Processing...' : 'Process Refund'}
              </button>
              <button
                onClick={() => setShowProcessModal(false)}
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
