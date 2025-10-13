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
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [bio, setBio] = useState('');
  
  const [pricing, setPricing] = useState({
    chatRatePerMinute: 0,
    callRatePerMinute: 0,
    videoCallRatePerMinute: 0,
  });

  const { data: astrologer, isLoading, refetch } = useQuery({
    queryKey: ['astrologer-detail', astrologerId],
    queryFn: async () => {
      const response = await adminApi.getAstrologerDetails(astrologerId);
      setPricing({
        chatRatePerMinute: response.data.data.pricing?.chat || 0,
        callRatePerMinute: response.data.data.pricing?.call || 0,
        videoCallRatePerMinute: response.data.data.pricing?.videoCall || 0,
      });
      setBio(response.data.data.bio || '');
      return response.data.data;
    },
  });

  const updatePricingMutation = useMutation({
    mutationFn: () => adminApi.updateAstrologerPricing(astrologerId, pricing),
    onSuccess: () => {
      toast.success('Pricing updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setIsEditingPricing(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update pricing');
    },
  });

  const updateBioMutation = useMutation({
    mutationFn: () => apiClient.patch(`/admin/astrologers/${astrologerId}/bio`, { bio }),
    onSuccess: () => {
      toast.success('Bio updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      setIsEditingBio(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update bio');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => apiClient.patch(`/admin/astrologers/${astrologerId}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      queryClient.invalidateQueries({ queryKey: ['astrologers'] });
      setShowStatusModal(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveAstrologer(astrologerId, adminNotes),
    onSuccess: () => {
      toast.success('Astrologer approved successfully');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      queryClient.invalidateQueries({ queryKey: ['pending-astrologers'] });
      setShowApprovalModal(false);
      setAdminNotes('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectAstrologer(astrologerId, rejectionReason),
    onSuccess: () => {
      toast.success('Astrologer rejected');
      queryClient.invalidateQueries({ queryKey: ['astrologer-detail', astrologerId] });
      queryClient.invalidateQueries({ queryKey: ['pending-astrologers'] });
      setShowRejectionModal(false);
      setRejectionReason('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject');
    },
  });

  const handleSavePricing = () => {
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
    setSelectedStatus(status);
    setShowStatusModal(true);
  };

  const confirmStatusChange = () => {
    updateStatusMutation.mutate(selectedStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const isPending = astrologer?.onboarding?.status === 'waitlist';

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
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  astrologer?.accountStatus === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {astrologer?.accountStatus}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  astrologer?.onboarding?.status === 'approved'
                    ? 'bg-blue-100 text-blue-800'
                    : astrologer?.onboarding?.status === 'waitlist'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {astrologer?.onboarding?.status}
                </span>
              </div>
              <div className="mt-3 flex items-center space-x-4">
                <div className="flex items-center">
                  <Star className="text-yellow-500 mr-1" size={16} />
                  <span className="font-semibold">{astrologer?.ratings?.average || 0}</span>
                  <span className="text-gray-500 text-sm ml-1">
                    ({astrologer?.ratings?.count || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            {isPending && (
              <>
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <CheckCircle size={18} className="mr-2" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle size={18} className="mr-2" />
                  Reject
                </button>
              </>
            )}
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
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban size={18} className="mr-2" />
                  Deactivate
                </button>
              </>
            )}
            {astrologer?.accountStatus !== 'active' && !isPending && (
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

        {/* Skills & Languages */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills & Languages</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {astrologer?.skills?.map((skill: string) => (
                  <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    {skill}
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
              <p className="text-gray-900">{astrologer?.experience || 0} years</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
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
              <label className="text-sm text-gray-500">Chat Rate (per minute)</label>
              {isEditingPricing ? (
                <input
                  type="number"
                  value={pricing.chatRatePerMinute}
                  onChange={(e) => setPricing({ ...pricing, chatRatePerMinute: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">₹{pricing.chatRatePerMinute}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-500">Call Rate (per minute)</label>
              {isEditingPricing ? (
                <input
                  type="number"
                  value={pricing.callRatePerMinute}
                  onChange={(e) => setPricing({ ...pricing, callRatePerMinute: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">₹{pricing.callRatePerMinute}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-500">Video Call Rate (per minute)</label>
              {isEditingPricing ? (
                <input
                  type="number"
                  value={pricing.videoCallRatePerMinute}
                  onChange={(e) => setPricing({ ...pricing, videoCallRatePerMinute: Number(e.target.value) })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">₹{pricing.videoCallRatePerMinute}</p>
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
              <p className="text-sm text-gray-500">Total Sessions</p>
              <p className="text-xl font-semibold text-gray-900">
                {astrologer?.stats?.totalSessions || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Chat Time</p>
              <p className="text-gray-900">
                {Math.floor((astrologer?.stats?.totalChatTime || 0) / 60)} hours
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Call Time</p>
              <p className="text-gray-900">
                {Math.floor((astrologer?.stats?.totalCallTime || 0) / 60)} hours
              </p>
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

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Approve Astrologer
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to approve <strong>{astrologer?.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes (Optional)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add any notes about this approval..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setAdminNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Application
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting <strong>{astrologer?.name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Provide a clear reason for rejection..."
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Status Change
            </h3>
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
    </div>
  );
}
