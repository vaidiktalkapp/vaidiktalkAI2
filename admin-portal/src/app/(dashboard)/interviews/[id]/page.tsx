'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Star, Clock, Phone, Video, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function InterviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const registrationId = params.id as string;

  const [showPassModal, setShowPassModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [failureReason, setFailureReason] = useState('');

  // Fetch registration details
  const { data: registration, isLoading } = useQuery({
    queryKey: ['registration-detail', registrationId],
    queryFn: async () => {
      const response = await adminApi.getRegistrationDetails(registrationId);
      return response.data.data;
    },
  });

  // Complete interview mutation
  const completeInterviewMutation = useMutation({
    mutationFn: (data: { round: number; passed: boolean; rating?: number; notes?: string; callDuration?: number }) =>
      adminApi.completeInterviewRound(registrationId, data.round, {
        passed: data.passed,
        rating: data.rating,
        notes: data.notes,
        callDuration: data.callDuration,
      }),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Interview completed successfully');
      queryClient.invalidateQueries({ queryKey: ['registration-detail', registrationId] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['interview-stats'] });
      setShowPassModal(false);
      setShowFailModal(false);
      setRating(0);
      setNotes('');
      setCallDuration('');
      setFailureReason('');
      
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete interview');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Registration not found</p>
      </div>
    );
  }

  const currentRound = parseInt(registration.status.split('_').pop());
  const currentRoundKey = `round${currentRound}` as 'round1' | 'round2' | 'round3' | 'round4';
  const interviewData = registration.interviews?.[currentRoundKey];

  const handlePass = () => {
    if (!rating || rating < 1 || rating > 5) {
      toast.error('Please provide a rating between 1 and 5');
      return;
    }

    completeInterviewMutation.mutate({
      round: currentRound,
      passed: true,
      rating,
      notes,
      callDuration: callDuration ? parseInt(callDuration) : undefined,
    });
  };

  const handleFail = () => {
    if (!failureReason.trim()) {
      toast.error('Please provide a failure reason');
      return;
    }

    completeInterviewMutation.mutate({
      round: currentRound,
      passed: false,
      rating,
      notes: failureReason,
    });
  };

  const getRoundDetails = (round: number) => {
    switch (round) {
      case 1:
        return {
          title: 'Round 1: Phone Screening',
          icon: <Phone className="text-blue-600" size={32} />,
          description: 'Initial phone screening to assess basic qualifications and communication skills',
          color: 'blue',
        };
      case 2:
        return {
          title: 'Round 2: Video Interview',
          icon: <Video className="text-green-600" size={32} />,
          description: 'Video interview to evaluate technical knowledge and presentation skills',
          color: 'green',
        };
      case 3:
        return {
          title: 'Round 3: Panel Interview',
          icon: <Users className="text-purple-600" size={32} />,
          description: 'Panel interview with senior astrologers to assess expertise',
          color: 'purple',
        };
      case 4:
        return {
          title: 'Round 4: Final Assessment',
          icon: <Video className="text-orange-600" size={32} />,
          description: 'Final assessment and approval decision',
          color: 'orange',
        };
      default:
        return null;
    }
  };

  const roundDetails = getRoundDetails(currentRound);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} className="mr-2" />
          Back to Interviews
        </button>
      </div>

      {/* Round Info Card */}
      <div className={`bg-${roundDetails?.color}-50 border border-${roundDetails?.color}-200 rounded-lg p-6`}>
        <div className="flex items-start space-x-4">
          {roundDetails?.icon}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{roundDetails?.title}</h2>
            <p className="text-gray-600 mt-1">{roundDetails?.description}</p>
          </div>
        </div>
      </div>

      {/* Candidate Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-gray-900 font-medium">{registration.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="text-gray-900">{registration.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="text-gray-900">{registration.phoneNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Ticket Number</p>
            <p className="text-gray-900 font-medium">{registration.ticketNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="text-gray-900">{new Date(registration.dateOfBirth).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gender</p>
            <p className="text-gray-900 capitalize">{registration.gender}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Languages Known</p>
          <div className="flex flex-wrap gap-2">
            {registration.languagesKnown?.map((lang: string) => (
              <span key={lang} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {lang}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm text-gray-500 mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {registration.skills?.map((skill: string) => (
              <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {registration.bio && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Bio</p>
            <p className="text-gray-700">{registration.bio}</p>
          </div>
        )}
      </div>

      {/* Interview Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Progress</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((round) => {
            const roundKey = `round${round}` as 'round1' | 'round2' | 'round3' | 'round4';
            const roundData = registration.interviews?.[roundKey];
            const isPast = round < currentRound;
            const isCurrent = round === currentRound;
            const isFuture = round > currentRound;

            return (
              <div
                key={round}
                className={`flex items-start space-x-4 p-4 rounded-lg ${
                  isCurrent
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : isPast
                    ? 'bg-gray-50'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    isPast ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  {isPast ? '✓' : round}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Round {round}</h4>
                  {roundData && roundData.status === 'completed' && (
  <div className="mt-2 text-sm">
    <p className="text-gray-600">
      <strong>Status:</strong>{' '}
      {round === 4
        ? roundData.approved
          ? '✅ Approved'
          : '❌ Rejected'
        : roundData.passed
        ? '✅ Passed'
        : '❌ Failed'}
    </p>

    {/* Only rounds 1–3 have rating */}
    {round !== 4 && roundData.rating != null && (
      <p className="text-gray-600">
        <strong>Rating:</strong> {roundData.rating}/5 ⭐
      </p>
    )}

    {roundData.notes && (
      <p className="text-gray-600">
        <strong>Notes:</strong> {roundData.notes}
      </p>
    )}

    {roundData.completedAt && (
      <p className="text-gray-500 text-xs mt-1">
        Completed: {new Date(roundData.completedAt).toLocaleString()}
      </p>
    )}
  </div>
)}

                  {isCurrent && (
                    <p className="text-blue-600 text-sm mt-1">👉 Currently conducting this round</p>
                  )}
                  {isFuture && <p className="text-gray-400 text-sm mt-1">Pending</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {registration.status.includes('interview') && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Decision</h3>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPassModal(true)}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={20} className="mr-2" />
              Pass & Continue
            </button>
            <button
              onClick={() => setShowFailModal(true)}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle size={20} className="mr-2" />
              Fail & Reject
            </button>
          </div>
        </div>
      )}

      {/* Pass Modal */}
      {showPassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pass Interview Round {currentRound}</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating (1-5) *</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {currentRound <= 3 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Call Duration (minutes)</label>
                <input
                  type="number"
                  value={callDuration}
                  onChange={(e) => setCallDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 30"
                  min="1"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Add any observations or feedback..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePass}
                disabled={completeInterviewMutation.isPending || !rating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {completeInterviewMutation.isPending ? 'Processing...' : 'Confirm Pass'}
              </button>
              <button
                onClick={() => {
                  setShowPassModal(false);
                  setRating(0);
                  setNotes('');
                  setCallDuration('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Modal */}
      {showFailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fail Interview Round {currentRound}</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will reject the application. Please provide a clear reason.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Failure Reason *</label>
              <textarea
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Provide specific reasons for failure..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleFail}
                disabled={completeInterviewMutation.isPending || !failureReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {completeInterviewMutation.isPending ? 'Processing...' : 'Confirm Failure'}
              </button>
              <button
                onClick={() => {
                  setShowFailModal(false);
                  setFailureReason('');
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
