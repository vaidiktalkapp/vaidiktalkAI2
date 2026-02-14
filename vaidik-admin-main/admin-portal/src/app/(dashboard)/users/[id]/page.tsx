'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, User as UserIcon, Wallet, Activity, ShoppingCart, 
  IndianRupee, Wifi, WifiOff, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import Link from 'next/link';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const { can } = usePermission();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletReason, setWalletReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Fetch User Details
  const { data: user, isLoading } = useQuery<any>({
    queryKey: ['user-detail', userId],
    queryFn: async () => {
      const response = await adminApi.getUserDetails(userId);
      // 🔍 DEBUG LOG: Check exactly what the API returns
      console.log('🔍 [API DEBUG] Raw Response:', response.data); 
      console.log('🔍 [API DEBUG] User Data:', response.data.data);
      console.log('🔍 [API DEBUG] isOnline Flag:', response.data.data?.isOnline);
      return response.data.data;
    },
    refetchInterval: 5000, 
  });

  // Fetch Transactions
  const { data: transactions } = useQuery({
    queryKey: ['user-transactions', userId],
    queryFn: async () => {
      const response = await adminApi.getUserTransactions(userId, 1, 10);
      return response.data.data;
    },
  });

  // Fetch Orders
  const { data: orders } = useQuery({
    queryKey: ['user-orders', userId],
    queryFn: async () => {
      const response = await adminApi.getUserOrders(userId, 1, 10);
      return response.data.data;
    },
  });

  // Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: () => adminApi.updateUserStatus(userId, newStatus, statusReason),
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      setShowStatusModal(false);
      setStatusReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Wallet Adjustment Mutation
  const walletMutation = useMutation({
    mutationFn: () => adminApi.adjustWalletBalance(userId, parseFloat(walletAmount), walletReason),
    onSuccess: () => {
      toast.success('Wallet adjusted successfully');
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['user-transactions', userId] });
      setShowWalletModal(false);
      setWalletAmount('');
      setWalletReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to adjust wallet');
    },
  });

  // Add Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteUser(userId, deleteReason),
    onSuccess: () => {
      toast.success('User account deleted successfully');
      router.push('/users'); // Redirect to list
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div className="p-12 text-center text-gray-500">User not found</div>;
  }

  // 🔍 RENDER DEBUG: Check what React is actually seeing
  console.log('👤 [RENDER DEBUG] User Object:', user);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Users
        </button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-6">
          {/* Profile Image with Online Indicator */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold flex-shrink-0 overflow-hidden">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0).toUpperCase()
              )}
            </div>
            {/* ✅ Online Status Dot */}
            <div 
              className={`absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-300'
              }`} 
              title={user.isOnline ? 'Online' : 'Offline'}
            />
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  {/* ✅ Online Status Badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    user.isOnline 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}>
                    {user.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                    {user.isOnline ? 'Online' : 'Offline'}
                  </div>
                </div>
                <p className="text-gray-600 mt-1">{user.phoneNumber}</p>
                {user.email && <p className="text-gray-500 text-sm">{user.email}</p>}
              </div>
              <StatusBadge status={user.status} />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickStat 
                label="Wallet Balance" 
                value={`₹${user.wallet?.balance?.toLocaleString() ?? 0}`} 
                color="text-green-600" 
              />
              <QuickStat 
                label="Total Spent" 
                value={`₹${user.stats?.totalSpent?.toLocaleString() ?? 0}`} 
                color="text-purple-600" 
              />
              <QuickStat 
                label="Total Orders" 
                value={user.stats?.orderCount ?? 0} 
              />
              <QuickStat 
                label="Joined" 
                value={new Date(user.createdAt).toLocaleDateString()} 
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {can('manage_users') && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Activity size={18} />
              Change Status
            </button>
            <button
              onClick={() => setShowWalletModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Wallet size={18} />
              Adjust Wallet
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ml-auto"
            >
              <Trash2 size={18} />
              Delete Account
            </button>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsCard 
          icon={Wallet} 
          title="Wallet Details" 
          items={[
            { label: 'Current Balance', value: `₹${user.wallet?.balance ?? 0}` },
            { label: 'Total Spent', value: `₹${user.stats?.totalSpent ?? 0}` },
          ]}
        />
        <StatsCard 
          icon={UserIcon} 
          title="Account Details" 
          items={[
            // ✅ Connection Status Line
            { 
              label: 'Connection Status', 
              value: user.isOnline ? 'Online Now' : 'Offline', 
              valueClass: user.isOnline ? 'text-green-600 font-bold' : 'text-gray-500' 
            },
            { label: 'Status', value: user.status, valueClass: getStatusColor(user.status) },
            { label: 'Verified', value: user.isPhoneVerified ? 'Yes' : 'No' },
            { label: 'Registration', value: user.registrationMethod },
            { label: 'Last Order', value: user.stats?.lastOrder ? new Date(user.stats.lastOrder.createdAt).toLocaleDateString() : 'Never' },
          ]}
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IndianRupee size={20} /> Recent Transactions
          </h3>
          <Link href={`/users/${userId}/transactions`} className="text-indigo-600 hover:underline text-sm">
            View All
          </Link>
        </div>
        {transactions?.transactions?.length ? (
          <div className="space-y-2">
            {transactions.transactions.map((txn: any) => (
              <div key={txn._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{txn.type?.replace('_', ' ') || 'Transaction'}</p>
                  <p className="text-xs text-gray-500">{new Date(txn.createdAt).toLocaleString()}</p>
                </div>
                <span className={`font-bold ${txn.type?.includes('credit') || txn.type?.includes('recharge') ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type?.includes('credit') || txn.type?.includes('recharge') ? '+' : '-'}₹{txn.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No transactions yet</p>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart size={20} /> Recent Orders
          </h3>
          <Link href={`/users/${userId}/orders`} className="text-indigo-600 hover:underline text-sm">
            View All
          </Link>
        </div>
        {orders?.orders?.length ? (
          <div className="space-y-2">
            {orders.orders.map((order: any) => (
              <Link 
                key={order._id} 
                href={`/orders/${order.orderId}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors group"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm group-hover:text-indigo-600">{order.orderId}</p>
                  <p className="text-xs text-gray-500">{order.type} • {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No orders yet</p>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <Modal title="Update User Status" onClose={() => setShowStatusModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select status...</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Explain why you're changing the status..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => statusMutation.mutate()}
                disabled={!newStatus || !statusReason || statusMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {statusMutation.isPending ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ✅ NEW: Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal title="Delete User Account" onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              Warning: This action will soft-delete the user immediately. Permanent deletion occurs after 7 days.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Deletion *</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Why is this account being deleted?"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={!deleteReason || deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Wallet Adjustment Modal */}
      {showWalletModal && (
        <Modal title="Adjust Wallet Balance" onClose={() => setShowWalletModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input
                type="number"
                value={walletAmount}
                onChange={(e) => setWalletAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter amount (use - for debit)"
              />
              <p className="text-xs text-gray-500 mt-1">Use positive number to credit, negative to debit</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
              <textarea
                value={walletReason}
                onChange={(e) => setWalletReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Explain the adjustment reason..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => walletMutation.mutate()}
                disabled={!walletAmount || !walletReason || walletMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {walletMutation.isPending ? 'Processing...' : 'Adjust Wallet'}
              </button>
              <button
                onClick={() => setShowWalletModal(false)}
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

// Helper Components
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-yellow-100 text-yellow-800',
    blocked: 'bg-red-100 text-red-800',
    deleted: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    failed: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
}

function QuickStat({ label, value, color = 'text-gray-900' }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`font-bold ${color}`}>{value}</p>
    </div>
  );
}

function StatsCard({ icon: Icon, title, items }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Icon size={20} /> {title}
      </h3>
      <dl className="space-y-3">
        {items.map((item: any) => (
          <div key={item.label} className="flex justify-between text-sm">
            <dt className="text-gray-500">{item.label}:</dt>
            <dd className={`font-medium ${item.valueClass || 'text-gray-900'}`}>{item.value}</dd>
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
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: 'text-green-600',
    suspended: 'text-yellow-600',
    blocked: 'text-red-600',
    deleted: 'text-gray-600',
  };
  return colors[status] || 'text-gray-600';
}