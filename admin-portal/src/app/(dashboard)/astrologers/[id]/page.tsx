'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, apiClient } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Calendar, Star, DollarSign, Edit, Save, Ban, CheckCircle, Shield, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AstrologerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const astrologerId = params.id as string;

  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [bio, setBio] = useState('');
  
  const [pricing, setPricing] = useState({
    chat: 0,
    call: 0,
    videoCall: 0,
  });

  // Fetch astrologer details
  const { data: astrologer, isLoading, refetch } = useQuery({
    queryKey: ['astrologer-detail', astrologerId],
    queryFn: async () => {
      const response = await adminApi.getAstrologerDetails(astrologerId);
      const data = response.data.data;
      
      // Initialize pricing
      setPricing({
        chat: data.pricing?.chat || 0,
        call: data.pricing?.call || 0,
        videoCall: data.pricing?.videoCall || 0,
      });
      
      // Initialize bio
      setBio(data.bio || '');
      
      return data;
    },
  });

  // Update pricing
  const updatePricingMutation = useMutation({
    mutationFn: () => adminApi.updateAstrologerPricing(astrologerId, pricing),
    onSuccess: () => {
      toast.success('Pricing updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setIsEditingPricing(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update pricing');
    },
  });

  // Update bio
  const updateBioMutation = useMutation({
    mutationFn: () => adminApi.updateAstrologerBio(astrologerId, bio),
    onSuccess: () => {
      toast.success('Bio updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setIsEditingBio(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update bio');
    },
  });

  // Update account status
  const updateStatusMutation = useMutation({
    mutationFn: (data: { status: string; reason?: string }) =>
      adminApi.updateAstrologerStatus(astrologerId, data.status, data.reason),
    onSuccess: () => {
      toast.success('Account status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      queryClient.invalidateQueries({ queryKey: ['astrologers'] });
      setShowStatusModal(false);
      setShowSuspendModal(false);
      setSuspensionReason('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleSavePricing = () => {
    if (pricing.chat < 0 || pricing.call < 0 || pricing.videoCall < 0) {
      toast.error('Pricing cannot be negative');
      return;
    }
    updatePricingMutation.mutate();
  };

  const handleSaveBio = () => {
    if (!bio.trim()) {
      toast.error('Bio cannot be empty');
      return;
    }
    updateBioMutation.mutate();
  };

  const handleStatusChange = (status: string) => {
    if (status === 'suspended') {
      setShowSuspendModal(true);
    } else {
      setSelectedStatus(status);
      setShowStatusModal(true);
    }
  };

  const confirmStatusChange = () => {
    updateStatusMutation.mutate({ status: selectedStatus });
  };

  const confirmSuspension = () => {
    if (!suspensionReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }
    updateStatusMutation.mutate({ status: 'suspended', reason: suspensionReason });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!astrologer) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Astrologer not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Astrologers
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
              {astrologer?.profilePicture ? (
                <img src={astrologer.profilePicture} alt={astrologer.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-purple-600 text-3xl font-semibold">
                  {astrologer?.name?.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{astrologer?.name}</h2>
              <p className="text-sm text-gray-500">Astrologer ID: {astrologer?._id}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    astrologer?.accountStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : astrologer?.accountStatus === 'suspended'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {astrologer?.accountStatus}
                </span>
                {astrologer?.profileCompletion?.isComplete ? (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Profile Complete
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Profile Incomplete
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="text-yellow-500 mr-1" size={16} />
                  <span className="font-semibold">{astrologer?.ratings?.average?.toFixed(1) || '0.0'}</span>
                  <span className="text-gray-500 text-sm ml-1">
                    ({astrologer?.ratings?.total || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            {astrologer?.accountStatus === 'active' && (
              <>
                <button
                  onClick={() => handleStatusChange('suspended')}
                  className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <Shield size={18} className="mr-2" />
                  Suspend
                </button>
                <button
                  onClick={() => handleStatusChange('inactive')}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  <Ban size={18} className="mr-2" />
                  Deactivate
                </button>
              </>
            )}
            {astrologer?.accountStatus === 'suspended' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle size={18} className="mr-2" />
                Unsuspend
              </button>
            )}
            {astrologer?.accountStatus === 'inactive' && (
              <button
                onClick={() => handleStatusChange('active')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CheckCircle size={18} className="mr-2" />
                Activate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="text-gray-900">{astrologer?.phoneNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{astrologer?.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="text-gray-900">
                  {new Date(astrologer?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Specializations & Languages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expertise & Languages</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-2">Specializations</p>
              <div className="flex flex-wrap gap-2">
                {astrologer?.specializations?.map((spec: string) => (
                  <span key={spec} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {spec}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2">Languages</p>
              <div className="flex flex-wrap gap-2">
                {astrologer?.languages?.map((lang: string) => (
                  <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Experience</p>
              <p className="text-gray-900">{astrologer?.experienceYears || 0} years</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pricing (per minute)</h3>
            {isEditingPricing ? (
              <button
                onClick={handleSavePricing}
                disabled={updatePricingMutation.isPending}
                className="flex items-center text-green-600 hover:text-green-700"
              >
                <Save size={18} className="mr-1" />
                Save
              </button>
            ) : (
              <button
                onClick={() => setIsEditingPricing(true)}
                className="flex items-center text-indigo-600 hover:text-indigo-700"
              >
                <Edit size={18} className="mr-1" />
                Edit
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Chat Rate</label>
              {isEditingPricing ? (
                <input
                  type="number"
                  value={pricing.chat}
                  onChange={(e) => setPricing({ ...pricing, chat: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">₹{pricing.chat}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-500">Call Rate</label>
              {isEditingPricing ? (
                <input
                  type="number"
                  value={pricing.call}
                  onChange={(e) => setPricing({ ...pricing, call: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">₹{pricing.call}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-500">Video Call Rate</label>
              {isEditingPricing ? (
                <input
                  type="number"
                  value={pricing.videoCall}
                  onChange={(e) => setPricing({ ...pricing, videoCall: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">₹{pricing.videoCall}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{astrologer?.stats?.totalEarnings?.toLocaleString() || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-semibold text-gray-900">
                {astrologer?.stats?.totalOrders || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Minutes</p>
              <p className="text-gray-900">
                {Math.floor((astrologer?.stats?.totalMinutes || 0) / 60)} hours
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Chat Orders</p>
              <p className="text-gray-900">{astrologer?.stats?.chatOrders || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Call Orders</p>
              <p className="text-gray-900">{astrologer?.stats?.callOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio Editor */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">About / Bio</h3>
          {isEditingBio ? (
            <button
              onClick={handleSaveBio}
              disabled={updateBioMutation.isPending}
              className="flex items-center text-green-600 hover:text-green-700"
            >
              <Save size={18} className="mr-1" />
              Save
            </button>
          ) : (
            <button
              onClick={() => setIsEditingBio(true)}
              className="flex items-center text-indigo-600 hover:text-indigo-700"
            >
              <Edit size={18} className="mr-1" />
              Edit
            </button>
          )}
        </div>
        {isEditingBio ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Write about the astrologer's background, expertise, and experience..."
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">{bio || 'No bio available'}</p>
        )}
      </div>

      {/* Availability Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Availability</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Online Status</p>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                astrologer?.availability?.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {astrologer?.availability?.isOnline ? '● Online' : '○ Offline'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Available for Sessions</p>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                astrologer?.availability?.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {astrologer?.availability?.isAvailable ? 'Available' : 'Busy'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Live Stream</p>
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                astrologer?.availability?.isLive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {astrologer?.availability?.isLive ? '🔴 Live' : 'Not Live'}
            </span>
          </div>
        </div>
        {astrologer?.availability?.lastActive && (
          <p className="text-sm text-gray-500 mt-4">
            Last active: {new Date(astrologer.availability.lastActive).toLocaleString()}
          </p>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Status Change</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to change the astrologer status to <strong>{selectedStatus}</strong>?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmStatusChange}
                disabled={updateStatusMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Suspend Astrologer</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for suspending <strong>{astrologer?.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Suspension Reason *</label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Provide a clear reason for suspension..."
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={confirmSuspension}
                disabled={updateStatusMutation.isPending || !suspensionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'Processing...' : 'Suspend'}
              </button>
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason('');
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
