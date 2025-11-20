'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Activity,
  Ban,
  CheckCircle,
  XCircle,
  Shield,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<
    'blocked' | 'active' | 'suspended'
  >('blocked');

  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: async () => {
      const response = await adminApi.getUserDetails(userId);
      return response.data.data;
    },
  });

  // ✅ NEW: User journey data
  const { data: journeyData } = useQuery({
    queryKey: ['user-journey', userId],
    queryFn: async () => {
      const response = await adminApi.getUserJourney(userId);
      return response.data.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      adminApi.updateUserStatus(userId, newStatus),
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['user-detail', userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowConfirmModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Failed to update status'
      );
    },
  });

  const handleStatusChange = (
    newStatus: 'blocked' | 'active' | 'suspended'
  ) => {
    setActionType(newStatus);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = () => {
    updateStatusMutation.mutate(actionType);
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
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          Back to Users
        </button>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 text-2xl font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-sm text-gray-500">User ID: {user?._id}</p>
              <span
                className={`mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                  user?.status
                )}`}
              >
                {user?.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            {user?.status === 'active' && (
              <>
                <button
                  onClick={() => handleStatusChange('suspended')}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <Shield size={18} className="mr-2" />
                  Suspend User
                </button>
                <button
                  onClick={() => handleStatusChange('blocked')}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban size={18} className="mr-2" />
                  Block User
                </button>
              </>
            )}
            {user?.status === 'blocked' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle size={18} className="mr-2" />
                Activate User
              </button>
            )}
            {user?.status === 'suspended' && (
              <>
                <button
                  onClick={() => handleStatusChange('active')}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Activate User
                </button>
                <button
                  onClick={() => handleStatusChange('blocked')}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban size={18} className="mr-2" />
                  Block User
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Contact Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-gray-900">{user?.phoneNumber || 'N/A'}</p>
              </div>
            </div>
            {user?.email && (
              <div className="flex items-center space-x-3">
                <Mail className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <Calendar className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-900">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            {user?.lastActive && (
              <div className="flex items-center space-x-3">
                <Activity className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Last Active</p>
                  <p className="text-gray-900">
                    {new Date(user.lastActive).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Wallet Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Wallet Information
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{user?.wallet?.balance?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Recharged</p>
              <p className="text-xl font-semibold text-green-600">
                ₹{user?.wallet?.totalRecharged?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-semibold text-red-600">
                ₹{user?.wallet?.totalSpent?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Consultation Orders */}
      {journeyData?.consultationOrders && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <ShoppingBag className="mr-2 text-indigo-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              Consultation Orders
            </h3>
            <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
              {journeyData.consultationOrders.count}
            </span>
          </div>

          {journeyData.consultationOrders.orders.length > 0 ? (
            <div className="space-y-2">
              {journeyData.consultationOrders.orders.slice(0, 5).map((order: any) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{order.orderId}</p>
                    <p className="text-sm text-gray-600">
                      {order.type} with {order.astrologerName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{order.totalAmount}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No consultation orders</p>
          )}
        </div>
      )}

      {/* ✅ NEW: Suggested Remedies */}
      {journeyData?.remediesSuggested && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="mr-2 text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              Suggested Remedies
            </h3>
            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-semibold">
              {journeyData.remediesSuggested.count}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-yellow-600">
                {journeyData.remediesSuggested.accepted}
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Purchased</p>
              <p className="text-2xl font-bold text-green-600">
                {journeyData.remediesSuggested.purchased}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {journeyData.remediesSuggested.count > 0
                  ? (
                      (journeyData.remediesSuggested.purchased /
                        journeyData.remediesSuggested.count) *
                      100
                    ).toFixed(1)
                  : '0'}
                %
              </p>
            </div>
          </div>

          {journeyData.remediesSuggested.remedies.length > 0 ? (
            <div className="space-y-2">
              {journeyData.remediesSuggested.remedies.slice(0, 5).map((remedy: any) => (
                <div
                  key={remedy._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {remedy.title ||
                        remedy.shopifyProduct?.productName ||
                        'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {remedy.status}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {remedy.isPurchased && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Purchased
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No suggested remedies</p>
          )}
        </div>
      )}

      {/* ✅ NEW: Shopify Purchases */}
      {journeyData?.shopifyPurchases && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <ShoppingBag className="mr-2 text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">
              Shopify Purchases
            </h3>
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              {journeyData.shopifyPurchases.count}
            </span>
          </div>

          {journeyData.shopifyPurchases.orders.length > 0 ? (
            <div className="space-y-2">
              {journeyData.shopifyPurchases.orders.slice(0, 5).map((order: any) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.shopifyCreatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    ₹{parseFloat(order.totalPrice).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No Shopify purchases</p>
          )}
        </div>
      )}

      {/* Account Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Account Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-blue-600">
              {user?.stats?.totalOrders || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600">
              {user?.stats?.completedOrders || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Spent</p>
            <p className="text-2xl font-bold text-purple-600">
              ₹{user?.stats?.totalSpent?.toLocaleString() || 0}
            </p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600">Avg Order Value</p>
            <p className="text-2xl font-bold text-yellow-600">
              ₹{user?.stats?.avgOrderValue?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              {actionType === 'blocked'
                ? 'block'
                : actionType === 'suspended'
                ? 'suspend'
                : 'activate'}{' '}
              this user?
              {actionType === 'blocked' && (
                <span className="block mt-2 text-red-600 text-sm">
                  This will prevent the user from logging in.
                </span>
              )}
              {actionType === 'suspended' && (
                <span className="block mt-2 text-yellow-600 text-sm">
                  This will temporarily restrict user access.
                </span>
              )}
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmStatusChange}
                disabled={updateStatusMutation.isPending}
                className={`flex-1 px-4 py-2 text-white rounded-lg ${
                  actionType === 'blocked'
                    ? 'bg-red-600 hover:bg-red-700'
                    : actionType === 'suspended'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:opacity-50`}
              >
                {updateStatusMutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
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
