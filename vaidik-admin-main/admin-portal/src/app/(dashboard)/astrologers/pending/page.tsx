'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { 
  CheckCircle, XCircle, Eye, Clock, User, 
  Mail, Phone, Calendar, MapPin, Award, BookOpen 
} from 'lucide-react';
import { toast } from 'sonner';

export default function PendingAstrologersPage() {
  const [page, setPage] = useState(1);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false); // New state for View Modal
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const queryClient = useQueryClient();

  // Fetch waitlist registrations
  const { data, isLoading } = useQuery({
    queryKey: ['pending-astrologers', page],
    queryFn: async () => {
      const response = await adminApi.getWaitlist({ page, limit: 10 });
      return response.data.data;
    },
  });

  // Fetch specific registration details (Enabled only when View Modal is open)
  const { data: detailedRegistration, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['registration-detail', selectedRegistration?._id],
    queryFn: async () => {
      const response = await adminApi.getRegistrationDetails(selectedRegistration._id);
      return response.data.data;
    },
    enabled: !!selectedRegistration?._id && showViewModal,
  });

  // Shortlist (approve to interview round 1)
  const approveMutation = useMutation({
    mutationFn: (data: { registrationId: string; adminNotes?: string }) =>
      adminApi.shortlistCandidate(data.registrationId, data.adminNotes),
    onSuccess: () => {
      toast.success('Candidate shortlisted for interview round 1');
      queryClient.invalidateQueries({ queryKey: ['pending-astrologers'] });
      queryClient.invalidateQueries({ queryKey: ['astrologer-stats'] });
      setShowApprovalModal(false);
      setShowViewModal(false); // Close view modal if open
      setAdminNotes('');
      setSelectedRegistration(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to shortlist candidate');
    },
  });

  // Reject registration
  const rejectMutation = useMutation({
    mutationFn: (data: { registrationId: string; reason: string }) =>
      adminApi.rejectRegistration(data.registrationId, data.reason, false),
    onSuccess: () => {
      toast.success('Application rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-astrologers'] });
      queryClient.invalidateQueries({ queryKey: ['astrologer-stats'] });
      setShowRejectionModal(false);
      setShowViewModal(false); // Close view modal if open
      setRejectionReason('');
      setSelectedRegistration(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    },
  });

  const handleApprove = () => {
    if (!selectedRegistration) return;
    approveMutation.mutate({
      registrationId: selectedRegistration._id,
      adminNotes,
    });
  };

  const handleReject = () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({
      registrationId: selectedRegistration._id,
      reason: rejectionReason,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pending Applications (Waitlist)</h1>
        <p className="text-gray-600 mt-1">Review and shortlist astrologer applications for interviews</p>
      </div>

      {/* Pending List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : data?.registrations?.length === 0 ? (
          <div className="text-center p-12">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No pending applications in waitlist</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {data?.registrations?.map((registration: any) => (
              <div key={registration._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  {/* Registration Info */}
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                      {registration.profilePicture ? (
                        <img src={registration.profilePicture} alt={registration.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="text-purple-600" size={32} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">{registration.name}</h3>
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-semibold">
                          {registration.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{registration.email}</p>
                      <p className="text-sm text-gray-600">{registration.phoneNumber}</p>
                      
                      {/* Languages */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {registration.languagesKnown?.map((lang: string) => (
                          <span key={lang} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {lang}
                          </span>
                        ))}
                      </div>
                      
                      {/* Skills */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {registration.skills?.map((skill: string) => (
                          <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Waitlist Info */}
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Ticket:</span>
                          <span className="ml-2 font-medium">{registration.ticketNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Position:</span>
                          <span className="ml-2 font-medium">#{registration.waitlist?.position || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Applied:</span>
                          <span className="ml-2 font-medium">
                            {new Date(registration.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowApprovalModal(true);
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={18} className="mr-2" />
                      Shortlist
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowRejectionModal(true);
                      }}
                      className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle size={18} className="mr-2" />
                      Reject
                    </button>
                    
                    {/* UPDATED VIEW BUTTON */}
                    <button
                      onClick={() => {
                        setSelectedRegistration(registration);
                        setShowViewModal(true);
                      }}
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

        {/* Pagination */}
        {data?.pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{page}</span> of{' '}
                  <span className="font-medium">{data.pagination.pages}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= data.pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                <button 
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedRegistration(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {isLoadingDetails ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                      {detailedRegistration?.profilePicture || selectedRegistration.profilePicture ? (
                        <img 
                          src={detailedRegistration?.profilePicture || selectedRegistration.profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="text-purple-600" size={40} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {detailedRegistration?.name || selectedRegistration.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {detailedRegistration?.status || selectedRegistration.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          Ticket: {detailedRegistration?.ticketNumber || selectedRegistration.ticketNumber}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <User size={18} /> Contact Information
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex items-center gap-3">
                          <Mail size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {detailedRegistration?.email || selectedRegistration.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {detailedRegistration?.phoneNumber || selectedRegistration.phoneNumber}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Applied: {new Date(detailedRegistration?.createdAt || selectedRegistration.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Professional Info */}
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Award size={18} /> Professional Details
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Languages</p>
                          <div className="flex flex-wrap gap-1">
                            {(detailedRegistration?.languagesKnown || selectedRegistration.languagesKnown || []).map((lang: string) => (
                              <span key={lang} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {(detailedRegistration?.skills || selectedRegistration.skills || []).map((skill: string) => (
                              <span key={skill} className="px-2 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details if available */}
                  {(detailedRegistration?.bio || detailedRegistration?.about) && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <BookOpen size={18} /> Bio / About
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">
                          {detailedRegistration.bio || detailedRegistration.about}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Modal Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                     <button
                      onClick={() => {
                        setShowViewModal(false);
                        setShowRejectionModal(true);
                      }}
                      className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        setShowApprovalModal(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Shortlist for Interview
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Shortlist for Interview
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You are about to shortlist <strong>{selectedRegistration?.name}</strong> for Interview Round 1
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
                placeholder="Add any notes about this candidate..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {approveMutation.isPending ? 'Processing...' : 'Confirm Shortlist'}
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setAdminNotes('');
                  setSelectedRegistration(null);
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
              Please provide a reason for rejecting <strong>{selectedRegistration?.name}</strong>
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
                {rejectMutation.isPending ? 'Processing...' : 'Confirm Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setSelectedRegistration(null);
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