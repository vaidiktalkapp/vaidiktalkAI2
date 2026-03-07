'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';
import { Gift, Plus, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GiftCard {
  _id: string;
  code: string;
  amount: number;
  currency: string;
  status: string;
  redemptionCount: number;
  maxRedemptions: number;
  expiresAt?: string;
  createdAt: string;
}

export default function GiftCardsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { can } = usePermission();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['gift-cards', page, statusFilter, searchQuery],
    queryFn: async () => {
      const response = await adminApi.getAllGiftCards({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      return response.data.data;
    },
    enabled: can('view_payments'),
  });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createGiftCard({
      code: code.toUpperCase(),
      amount: parseFloat(amount),
      maxRedemptions: parseInt(maxRedemptions),
      expiresAt: expiresAt || undefined,
    }),
    onSuccess: () => {
      toast.success('Gift card created successfully');
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      setShowCreateModal(false);
      setCode('');
      setAmount('');
      setMaxRedemptions('1');
      setExpiresAt('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create gift card');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ code, status }: { code: string; status: 'active' | 'disabled' | 'expired' }) =>
      adminApi.updateGiftCardStatus(code, status),
    onSuccess: () => {
      toast.success('Gift card status updated');
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const columns: Column<GiftCard>[] = [
    {
      header: 'Code',
      cell: (card) => (
        <span className="font-mono font-bold text-indigo-600 text-lg">{card.code}</span>
      ),
    },
    {
      header: 'Amount',
      cell: (card) => (
        <span className="font-bold text-green-600 text-lg">{card.amount.toLocaleString()} Cr</span>
      ),
    },
    {
      header: 'Redemptions',
      cell: (card) => (
        <span className="text-gray-700">
          {card.redemptionCount} / {card.maxRedemptions === -1 ? '∞' : card.maxRedemptions}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (card) => {
        const colors: Record<string, string> = {
          active: 'bg-green-100 text-green-800',
          disabled: 'bg-gray-100 text-gray-800',
          expired: 'bg-red-100 text-red-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[card.status]}`}>
            {card.status}
          </span>
        );
      },
    },
    {
      header: 'Expires',
      cell: (card) => card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'Never',
      className: 'text-gray-500 text-sm',
    },
    {
      header: 'Created',
      cell: (card) => new Date(card.createdAt).toLocaleDateString(),
      className: 'text-gray-500 text-sm',
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (card) => (
        can('manage_payments') && (
          <div className="flex justify-end gap-2">
            {card.status === 'active' && (
              <button
                onClick={() => statusMutation.mutate({ code: card.code, status: 'disabled' })}
                className="text-yellow-600 hover:text-yellow-800 flex items-center gap-1 text-sm"
              >
                <Ban size={14} /> Disable
              </button>
            )}
            {card.status === 'disabled' && (
              <button
                onClick={() => statusMutation.mutate({ code: card.code, status: 'active' })}
                className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
              >
                <CheckCircle size={14} /> Activate
              </button>
            )}
          </div>
        )
      ),
    },
  ];

  if (!can('view_payments')) {
    return <div className="p-12 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gift Cards</h1>
          <p className="text-gray-600 mt-1">Create and manage promotional codes</p>
        </div>
        {can('manage_payments') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus size={18} />
            Create Gift Card
          </button>
        )}
      </div>

      <FilterBar
        filters={[
          {
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Disabled', value: 'disabled' },
              { label: 'Expired', value: 'expired' },
            ],
            placeholder: 'All Status',
          },
        ]}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by code..."
        onReset={() => { setStatusFilter(''); setSearchQuery(''); }}
      />

      <DataTable
        data={data?.giftCards || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage,
        }}
      />

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create Gift Card" onClose={() => setShowCreateModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                placeholder="PROMO2024"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">Uppercase letters, numbers, and hyphens only</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Credits) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Redemptions</label>
              <input
                type="number"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="1"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">How many times this code can be used</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expires At (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => createMutation.mutate()}
                disabled={!code || !amount || createMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Gift size={18} />
                {createMutation.isPending ? 'Creating...' : 'Create Gift Card'}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
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
