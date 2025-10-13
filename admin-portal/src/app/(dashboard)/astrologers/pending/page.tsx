// src/app/(dashboard)/astrologers/pending/page.tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function PendingAstrologersPage() {
  const [page, setPage] = useState(1);
  const [selectedAstrologer, setSelectedAstrologer] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pending-astrologers', page],
    queryFn: async () => {
      const response = await adminApi.getPendingAstrologers({ page, limit: 10 });
      return response.data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (data: { astrologerId: string; adminNotes?: string }) =>
      adminApi.approveAstrologer(data.astrologerId, data.adminNotes),
    onSuccess: () => {
      toast.success('Astrologer approved successfully');
      queryClient.invalidateQueries({ queryKey: ['pending-astrologers'] });
      setShowApprovalModal(false);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { astrologerId: string; reason: string }) =>
      adminApi.rejectAstrologer(data.astrologerId, data.reason),
    onSuccess: () => {
      toast.success('Astrologer application rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-astrologers'] });
      setShowRejectionModal(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject');
    },
  });

  const handleApprove = () => {
    if (!selectedAstrologer) return;
    approveMutation.mutate({
      astrologerId: selectedAstrologer._id,
      adminNotes,
    });
  };

  const handleReject = () => {
    if (!selectedAstrologer || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({
      astrologerId: selectedAstrologer._id,
      reason: rejectionReason,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Astrologers</h1>
        <p className="text-gray-600 mt-1">Review and approve astrologer applications</p>
      </div>

      {/* Pending List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : data?.astrologers?.length === 0 ? (
          <div className="text-center p-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No pending applications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.astrologers?.map((astrologer: any) => (
              <div key={astrologer._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  {/* Astrologer Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                      {astrologer.profilePicture ? (
                        <img src={astrologer.profilePicture} alt={astrologer.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-purple-600 text-xl font-semibold">
                          {astrologer.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{astrologer.name}</h3>
                      <p className="text-sm text-gray-600">{astrologer.email}</p>
                      <p className="text-sm text-gray-600">{astrologer.phoneNumber}</p>
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {astrologer.languages?.map((lang: string) => (
                          <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {lang}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {astrologer.skills?.map((skill: string) => (
                          <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Experience:</span>
                          <span className="ml-2 font-medium">{astrologer.experience || 0} years</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Token:</span>
                          <span className="ml-2 font-medium">{astrologer.onboarding?.tokenNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Applied:</span>
                          <span className="ml-2 font-medium">
                            {new Date(astrologer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedAstrologer(astrologer);
                        setShowApprovalModal(true);
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAstrologer(astrologer);
                        setShowRejectionModal(true);
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={18} className="mr-2" />
                      Reject
                    </button>
                    <button
                      onClick={() => window.open(`/astrologers/${astrologer._id}`, '_blank')}
                      className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <Eye size={18} className="mr-2" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              You are about to approve <strong>{selectedAstrologer?.name}</strong>
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
                onClick={handleApprove}
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
              Please provide a reason for rejecting <strong>{selectedAstrologer?.name}</strong>
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
                onClick={handleReject}
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
    </div>
  );
}
