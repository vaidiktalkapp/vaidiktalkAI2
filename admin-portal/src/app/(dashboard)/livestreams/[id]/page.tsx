'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Clock,
  DollarSign,
  Heart,
  MessageCircle,
  Gift,
  Phone,
  Video,
  AlertTriangle,
  Ban,
  Eye,
  TrendingUp,
  PhoneOff
} from 'lucide-react';
import { toast } from 'sonner';

export default function StreamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const streamId = params.id as string;

  const [showForceEndModal, setShowForceEndModal] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch stream details
  const { data: streamData, isLoading } = useQuery({
    queryKey: ['stream-detail', streamId],
    queryFn: async () => {
      const response = await adminApi.getStreamDetails(streamId);
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 3000 : false, // Refresh every 3 seconds
  });

  // Fetch stream analytics
  const { data: analytics } = useQuery({
    queryKey: ['stream-analytics', streamId],
    queryFn: async () => {
      const response = await adminApi.getStreamAnalytics(streamId);
      return response.data.data;
    },
    enabled: streamData?.stream?.status === 'ended',
  });

  // Force end stream mutation
  const forceEndMutation = useMutation({
    mutationFn: (reason: string) => adminApi.forceEndStream(streamId, reason),
    onSuccess: () => {
      toast.success('Stream ended successfully');
      queryClient.invalidateQueries({ queryKey: ['stream-detail', streamId] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      queryClient.invalidateQueries({ queryKey: ['live-streams'] });
      setShowForceEndModal(false);
      setEndReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end stream');
    },
  });

  const forceEndCallMutation = useMutation({
    mutationFn: () => adminApi.forceEndCall(streamId),
    onSuccess: () => {
      toast.success('Call ended successfully');
      queryClient.invalidateQueries({ queryKey: ['stream-detail', streamId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end call');
    },
  });

  const handleEndCall = () => {
    if (confirm('Are you sure you want to disconnect this user from the call? The stream will continue.')) {
      forceEndCallMutation.mutate();
    }
  };

  const handleForceEnd = () => {
    if (!endReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    forceEndMutation.mutate(endReason);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getLiveDuration = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);
    return formatDuration(diff);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stream = streamData?.stream;
  const viewers = streamData?.viewers || [];
  const calls = streamData?.calls || [];
  const waitlist = streamData?.callWaitlist || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{stream?.title}</h1>
            <p className="text-sm text-gray-500">{stream?.streamId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {stream?.status === 'live' && (
            <>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>
              <button
                onClick={() => setShowForceEndModal(true)}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Ban size={18} className="mr-2" />
                Force End Stream
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`rounded-lg p-4 ${
          stream?.status === 'live'
            ? 'bg-red-50 border border-red-200'
            : stream?.status === 'ended'
            ? 'bg-gray-50 border border-gray-200'
            : 'bg-blue-50 border border-blue-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                stream?.status === 'live'
                  ? 'bg-red-600 text-white animate-pulse'
                  : stream?.status === 'ended'
                  ? 'bg-gray-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {stream?.status === 'live' ? '🔴 LIVE' : stream?.status?.toUpperCase()}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                stream?.currentState === 'on_call'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {stream?.currentState === 'on_call' ? '📞 On Call' : '🎥 Streaming'}
            </span>
          </div>
          <div className="flex items-center space-x-6 text-sm">
            {stream?.status === 'live' && (
              <>
                <div className="flex items-center space-x-1">
                  <Users size={16} className="text-gray-500" />
                  <span className="font-semibold">{stream?.viewerCount}</span>
                  <span className="text-gray-500">watching</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock size={16} className="text-gray-500" />
                  <span className="font-semibold">{getLiveDuration(stream?.startedAt)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Astrologer Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Astrologer Information</h3>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
            {stream?.hostId?.profilePicture ? (
              <img
                src={stream.hostId.profilePicture}
                alt={stream.hostId.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-purple-600 text-2xl font-semibold">
                {stream?.hostId?.name?.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{stream?.hostId?.name}</h4>
            <p className="text-sm text-gray-600">{stream?.hostId?.email}</p>
            <p className="text-sm text-gray-600">{stream?.hostId?.phoneNumber}</p>
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">Mic:</span>
                <span className={`text-sm font-semibold ${stream?.isMicEnabled ? 'text-green-600' : 'text-red-600'}`}>
                  {stream?.isMicEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">Camera:</span>
                <span
                  className={`text-sm font-semibold ${stream?.isCameraEnabled ? 'text-green-600' : 'text-red-600'}`}
                >
                  {stream?.isCameraEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Viewers</p>
              <p className="text-2xl font-bold text-gray-900">{streamData?.currentViewers || 0}</p>
            </div>
            <Users className="text-indigo-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Peak Viewers</p>
              <p className="text-2xl font-bold text-blue-600">{stream?.peakViewers || 0}</p>
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-green-600">{stream?.totalViews || 0}</p>
            </div>
            <Eye className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-purple-600">₹{stream?.totalRevenue || 0}</p>
            </div>
            <DollarSign className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Engagement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Heart className="text-red-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Likes</p>
              <p className="text-xl font-bold text-gray-900">{stream?.totalLikes || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="text-blue-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Comments</p>
              <p className="text-xl font-bold text-gray-900">{stream?.totalComments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3">
            <Gift className="text-purple-500" size={24} />
            <div>
              <p className="text-sm text-gray-600">Gifts</p>
              <p className="text-xl font-bold text-gray-900">{stream?.totalGifts || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ UPDATED: Current Call Info with Action Button */}
      {stream?.currentCall?.isOnCall && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current Call</h3>
            
            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              disabled={forceEndCallMutation.isPending}
              className="flex items-center px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <PhoneOff size={16} className="mr-2" />
              {forceEndCallMutation.isPending ? 'Ending...' : 'Force End Call'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Caller</p>
              <p className="font-semibold text-gray-900">{stream.currentCall.callerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Call Type</p>
              <div className="flex items-center space-x-1">
                {stream.currentCall.callType === 'video' ? (
                  <Video size={16} className="text-blue-600" />
                ) : (
                  <Phone size={16} className="text-green-600" />
                )}
                <span className="font-semibold text-gray-900 capitalize">{stream.currentCall.callType}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Call Mode</p>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  stream.currentCall.callMode === 'public'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {stream.currentCall.callMode}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <span className="font-semibold text-gray-900 font-mono">
                {/* Calculate duration simply based on start time */}
                {stream.currentCall.startedAt ? getLiveDuration(stream.currentCall.startedAt) : '0:00'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Call Waitlist */}
      {waitlist.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Call Waitlist ({waitlist.filter((r: any) => r.status === 'waiting').length})
          </h3>
          <div className="space-y-3">
            {waitlist
              .filter((request: any) => request.status === 'waiting')
              .map((request: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 text-xs font-semibold">#{request.position}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{request.userName}</p>
                      <p className="text-sm text-gray-600">
                        {request.callType === 'video' ? '📹' : '📞'} {request.callType} •{' '}
                        {request.callMode === 'public' ? '🌐' : '🔒'} {request.callMode}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(request.requestedAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Viewers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Active Viewers ({viewers.filter((v: any) => v.isActive).length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {viewers
  .filter((viewer: any) => viewer.isActive)
  .slice(0, 20)
  .map((viewer: any) => (
    <div key={viewer.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
        {viewer.userId?.profileImage ? (
          <img src={viewer.userId.profileImage} alt={viewer.userId.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-purple-600 text-xs font-semibold">
            {viewer.userId?.name?.charAt(0)}
          </span>
        )}
      </div>
      <span className="text-sm text-gray-900 truncate">{viewer.userId?.name}</span>
    </div>
  ))}
        </div>
      </div>

      {/* Call History */}
      {calls.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Call History ({calls.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charge</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {calls.map((call: any) => (
  <tr key={call.id}>
    <td className="px-4 py-3 text-sm text-gray-900">{call.userId?.name}</td>
    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{call.callType}</td>
    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{call.callMode}</td>
    <td className="px-4 py-3 text-sm text-gray-900">{formatDuration(call.duration || 0)}</td>
    <td className="px-4 py-3 text-sm text-gray-900">₹{call.totalCharge || 0}</td>
    <td className="px-4 py-3">
      <span className={`px-2 py-1 text-xs font-semibold rounded ${call.status === 'completed' ? 'bg-green-100 text-green-800' : call.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
        {call.status}
      </span>
    </td>
  </tr>
))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Force End Modal */}
      {showForceEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="text-red-600" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Force End Stream</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              This will immediately end the livestream. The astrologer and all viewers will be disconnected.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason for ending stream *</label>
              <textarea
                value={endReason}
                onChange={(e) => setEndReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Provide a reason for ending this stream..."
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleForceEnd}
                disabled={forceEndMutation.isPending || !endReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {forceEndMutation.isPending ? 'Ending...' : 'End Stream'}
              </button>
              <button
                onClick={() => {
                  setShowForceEndModal(false);
                  setEndReason('');
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
