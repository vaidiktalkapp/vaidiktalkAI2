'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Star, IndianRupee, TrendingUp, Activity,
  MessageCircle, Phone, Video, Settings, Ban, CheckCircle,
  Wallet, Gift, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import type { Astrologer as BaseAstrologer, AstrologerPerformance } from '@/types/astrologer';
import Link from 'next/link';

// Extend the base interface to include the new earnings structure
interface Astrologer extends BaseAstrologer {
  earnings?: {
    totalEarned: number;          // Gross (Calls + Chats + Gifts)
    totalGiftEarnings: number;    // ✅ NEW: Specific Gift Revenue
    platformCommission: number;   // Platform cut
    platformCommissionRate: number;
    netEarnings: number;          // Astrologer take home
    totalPenalties: number;
    withdrawableAmount: number;   // Available
    totalWithdrawn: number;
    pendingWithdrawal: number;
    lastUpdated: string;
  };
  stats: BaseAstrologer['stats'] & {
    totalGifts?: number;          // ✅ NEW: Count of gifts received
  };
}

export default function AstrologerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const astrologerId = params.id as string;
  const { can } = usePermission();

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const [showPricingModal, setShowPricingModal] = useState(false);
  const [chatRate, setChatRate] = useState('');
  const [callRate, setCallRate] = useState('');
  const [videoRate, setVideoRate] = useState('');

  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [callEnabled, setCallEnabled] = useState(false);
  const [liveEnabled, setLiveEnabled] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Waive Penalty State
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [selectedPenaltyId, setSelectedPenaltyId] = useState('');
  const [waiveReason, setWaiveReason] = useState('');

  // Fetch Astrologer Details
  const { data: astrologer, isLoading } = useQuery<Astrologer>({
    queryKey: ['astrologer-detail', astrologerId],
    queryFn: async () => {
      const response = await adminApi.getAstrologerDetails(astrologerId);
      const data = response.data.data;

      // Initialize pricing modal values
      setChatRate(data.pricing?.chat?.toString() || '0');
      setCallRate(data.pricing?.call?.toString() || '0');
      setVideoRate(data.pricing?.videoCall?.toString() || '0');

      // Initialize features
      setChatEnabled(data.isChatEnabled || false);
      setCallEnabled(data.isCallEnabled || false);
      setLiveEnabled(data.isLiveStreamEnabled || false);

      return data;
    },
  });

  // Fetch Performance Metrics
  const { data: performance } = useQuery<AstrologerPerformance>({
    queryKey: ['astrologer-performance', astrologerId],
    queryFn: async () => {
      const response = await adminApi.getAstrologerPerformance(astrologerId);
      return response.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAstrologer(astrologerId, deleteReason),
    onSuccess: () => {
      toast.success('Astrologer account deleted successfully');
      router.push('/astrologers'); // Redirect to list
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete astrologer');
    },
  });

  // Waive Penalty Mutation
  const waiveMutation = useMutation({
    mutationFn: () => adminApi.waivePenalty(astrologerId, selectedPenaltyId, waiveReason),
    onSuccess: () => {
      toast.success('Penalty waived successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setShowWaiveModal(false);
      setWaiveReason('');
      setSelectedPenaltyId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to waive penalty');
    },
  });

  // Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: () => adminApi.updateAstrologerStatus(astrologerId, newStatus, statusReason),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setShowStatusModal(false);
      setStatusReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Update Pricing Mutation
  const pricingMutation = useMutation({
    mutationFn: () => adminApi.updateAstrologerPricing(astrologerId, {
      chatRatePerMinute: parseFloat(chatRate),
      callRatePerMinute: parseFloat(callRate),
      videoCallRatePerMinute: parseFloat(videoRate),
    }),
    onSuccess: () => {
      toast.success('Pricing updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setShowPricingModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update pricing');
    },
  });

  // Toggle Features Mutation
  const featuresMutation = useMutation({
    mutationFn: () => adminApi.toggleAstrologerFeatures(astrologerId, {
      isChatEnabled: chatEnabled,
      isCallEnabled: callEnabled,
      isLiveStreamEnabled: liveEnabled,
    }),
    onSuccess: () => {
      toast.success('Features updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setShowFeaturesModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update features');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!astrologer) {
    return <div className="p-12 text-center text-gray-500">Astrologer not found</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Astrologers
        </button>
      </div>

      {/* Astrologer Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-6">
          {/* Profile Image */}
          <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-3xl font-bold flex-shrink-0 overflow-hidden">
            {astrologer.profilePicture ? (
              <img src={astrologer.profilePicture} alt={astrologer.name} className="w-full h-full object-cover" />
            ) : (
              astrologer.name?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Astrologer Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{astrologer.name}</h2>
                <p className="text-gray-600 mt-1">{astrologer.phoneNumber}</p>
                {astrologer.email && <p className="text-gray-500 text-sm">{astrologer.email}</p>}
                <p className="text-gray-400 text-xs font-mono mt-1">ID: {astrologer._id}</p>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill={i < Math.round(astrologer.ratings?.average || 0) ? 'gold' : 'none'}
                        className="text-yellow-500"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {astrologer.ratings?.average?.toFixed(1) || 'New'} ({astrologer.ratings?.total || 0} reviews)
                  </span>
                </div>
              </div>
              <StatusBadge status={astrologer.accountStatus} />
            </div>

            {/* Specializations */}
            <div className="flex flex-wrap gap-2 mb-4">
              {astrologer.specializations?.map((spec) => (
                <span key={spec} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200">
                  {spec}
                </span>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickStat label="Experience" value={`${astrologer.experienceYears || 0} years`} />
              <QuickStat label="Total Orders" value={astrologer.stats?.totalOrders || 0} />
              <QuickStat
                label="Net Earnings"
                value={`₹${(astrologer.earnings?.netEarnings || astrologer.stats?.totalEarnings || 0).toLocaleString()}`}
                color="text-green-600"
              />
              <QuickStat
                label="Profile"
                value={`${astrologer.profileCompletion?.percentage || 0}%`}
                color={astrologer.profileCompletion?.isComplete ? 'text-green-600' : 'text-orange-600'}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {can('manage_astrologers') && (
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Activity size={18} />
              Change Status
            </button>
            <button
              onClick={() => setShowPricingModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <IndianRupee size={18} />
              Update Pricing
            </button>
            <button
              onClick={() => setShowFeaturesModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Settings size={18} />
              Manage Features
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

      {/* Bio */}
      {astrologer.bio && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
          <p className="text-gray-700 leading-relaxed">{astrologer.bio}</p>
        </div>
      )}

      {/* 🆕 FINANCIAL OVERVIEW - Updated with Gifts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wallet size={20} className="text-indigo-600" /> Financial Overview
          </h3>
          <span className="text-xs text-gray-500">
            Commission Rate: {astrologer.earnings?.platformCommissionRate ?? '—'}%
          </span>
        </div>

        {/* Adjusted Grid for 6 items including Gifts */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-gray-100">
          <div className="p-6 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Total Gross</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{(astrologer.earnings?.totalEarned || 0).toLocaleString()}
            </p>
          </div>

          {/* ✅ NEW: Gift Earnings */}
          <div className="p-6 text-center bg-pink-50">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Gift size={14} className="text-pink-600" />
              <p className="text-xs font-medium text-pink-700 uppercase">Gift Revenue</p>
            </div>
            <p className="text-xl font-bold text-pink-700">
              ₹{(astrologer.earnings?.totalGiftEarnings || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-6 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase mb-2">Platform Comm.</p>
            <p className="text-xl font-bold text-indigo-600">
              ₹{(astrologer.earnings?.platformCommission || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-6 text-center bg-green-50">
            <p className="text-xs font-medium text-green-700 uppercase mb-2">Net Earnings</p>
            <p className="text-xl font-bold text-green-700">
              ₹{(astrologer.earnings?.netEarnings || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-6 text-center">
            <p className="text-xs font-medium text-red-500 uppercase mb-2">Penalties</p>
            <p className="text-xl font-bold text-red-600">
              -₹{(astrologer.earnings?.totalPenalties || 0).toLocaleString()}
            </p>
          </div>

          <div className="p-6 text-center bg-blue-50">
            <p className="text-xs font-medium text-blue-700 uppercase mb-2">Withdrawable</p>
            <p className="text-xl font-bold text-blue-700">
              ₹{(astrologer.earnings?.withdrawableAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      {performance && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard label="Total Orders" value={performance.performance.totalOrders} />
            <MetricCard label="Completed" value={performance.performance.completedOrders} color="text-green-600" />
            <MetricCard label="Revenue" value={`₹${performance.performance.totalRevenue.toLocaleString()}`} color="text-purple-600" />
            <MetricCard label="Avg Rating" value={performance.performance.averageRating.toFixed(1)} color="text-yellow-600" />
            {/* Added Gifts Count if available */}
            <MetricCard label="Gifts Received" value={astrologer.stats?.totalGifts || 0} color="text-pink-600" />
          </div>
        </div>
      )}

      {/* Services & Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ServiceCard
          icon={MessageCircle}
          title="Chat"
          rate={astrologer.pricing?.chat}
          enabled={astrologer.isChatEnabled}
        />
        <ServiceCard
          icon={Phone}
          title="Call"
          rate={astrologer.pricing?.call}
          enabled={astrologer.isCallEnabled}
        />
        <ServiceCard
          icon={Video}
          title="Livestream"
          rate={astrologer.pricing?.videoCall}
          enabled={astrologer.isLiveStreamEnabled}
        />
      </div>

      {/* Penalties */}
      {astrologer.penalties && astrologer.penalties.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
            <Ban size={20} className="text-red-500" /> Penalty History
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {astrologer.penalties.map((penalty) => (
                  <tr key={penalty._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(penalty.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-red-600">
                      ₹{penalty.amount}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {penalty.reason}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={penalty.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      {(penalty.status === 'applied' || penalty.status === 'pending') && (
                        <button
                          onClick={() => {
                            setSelectedPenaltyId(penalty._id);
                            setShowWaiveModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 px-3 py-1 rounded border border-indigo-200 hover:bg-indigo-50 transition-colors"
                        >
                          Waive
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      {performance?.recentOrders && performance.recentOrders.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {performance.recentOrders.map((order: any) => (
              <Link
                key={order._id}
                href={`/orders/${order.orderId}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {order.userId?.profileImage ? (
                      <img src={order.userId.profileImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold">
                        {order.userId?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 group-hover:text-indigo-600">{order.orderId}</p>
                    <p className="text-xs text-gray-500">{order.type} • {new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="font-bold text-gray-900">₹{order.totalAmount}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <Modal title="Update Astrologer Status" onClose={() => setShowStatusModal(false)}>
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
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Explain the status change..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => statusMutation.mutate()}
                disabled={!newStatus || statusMutation.isPending}
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

      {/* Pricing Update Modal */}
      {showPricingModal && (
        <Modal title="Update Pricing" onClose={() => setShowPricingModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chat Rate (₹/min)</label>
              <input
                type="number"
                value={chatRate}
                onChange={(e) => setChatRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Rate (₹/min)</label>
              <input
                type="number"
                value={callRate}
                onChange={(e) => setCallRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Call Rate (₹/min)</label>
              <input
                type="number"
                value={videoRate}
                onChange={(e) => setVideoRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => pricingMutation.mutate()}
                disabled={pricingMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {pricingMutation.isPending ? 'Updating...' : 'Update Pricing'}
              </button>
              <button
                onClick={() => setShowPricingModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Features Toggle Modal */}
      {showFeaturesModal && (
        <Modal title="Manage Features" onClose={() => setShowFeaturesModal(false)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} className="text-blue-600" />
                <span className="font-medium">Chat Enabled</span>
              </div>
              <input
                type="checkbox"
                checked={chatEnabled}
                onChange={(e) => setChatEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Phone size={20} className="text-green-600" />
                <span className="font-medium">Call Enabled</span>
              </div>
              <input
                type="checkbox"
                checked={callEnabled}
                onChange={(e) => setCallEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Video size={20} className="text-red-600" />
                <span className="font-medium">Livestream Enabled</span>
              </div>
              <input
                type="checkbox"
                checked={liveEnabled}
                onChange={(e) => setLiveEnabled(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => featuresMutation.mutate()}
                disabled={featuresMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {featuresMutation.isPending ? 'Updating...' : 'Update Features'}
              </button>
              <button
                onClick={() => setShowFeaturesModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Waive Penalty Modal */}
      {showWaiveModal && (
        <Modal title="Waive Astrologer Penalty" onClose={() => setShowWaiveModal(false)}>
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
              <strong>Note:</strong> Waiving this penalty will return the deducted amount back to the Astrologer's Withdrawable Balance immediately.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Waiver *</label>
              <textarea
                value={waiveReason}
                onChange={(e) => setWaiveReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Example: Software glitch during call, System error, etc."
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => waiveMutation.mutate()}
                disabled={!waiveReason || waiveMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {waiveMutation.isPending ? 'Waiving...' : 'Confirm Waive'}
              </button>
              <button
                onClick={() => {
                  setShowWaiveModal(false);
                  setWaiveReason('');
                  setSelectedPenaltyId('');
                }}
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
        <Modal title="Delete Astrologer Account" onClose={() => setShowDeleteModal(false)}>
          <div className="space-y-4">
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <strong>Critical Action:</strong> This will immediately hide the astrologer from search results.
              They will not be able to log in. Data is retained for 7 days for payout reconciliation.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Deletion *</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Example: Requested via email, Violation of terms, etc."
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
    </div>
  );
}

// Helper Components
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    blocked: 'bg-red-100 text-red-800',
    deleted: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
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

function MetricCard({ label, value, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, rate, enabled }: any) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${enabled ? 'border-green-200' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={24} className={enabled ? 'text-green-600' : 'text-gray-400'} />
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        {enabled ? (
          <CheckCircle size={20} className="text-green-600" />
        ) : (
          <Ban size={20} className="text-gray-400" />
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">₹{rate || 0}<span className="text-sm text-gray-500">/min</span></p>
      <p className="text-xs text-gray-500 mt-1">{enabled ? 'Active' : 'Disabled'}</p>
    </div>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}