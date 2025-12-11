'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { ArrowLeft, Users, Clock, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LiveStreamsPage() {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch live streams with auto-refresh
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['live-streams'],
    queryFn: async () => {
      const response = await adminApi.getLiveStreams({ page: 1, limit: 50 });
      return response.data.data;
    },
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds
  });

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const diff = Math.floor((now - start) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return hours > 0 
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Streams</h1>
            <p className="text-gray-600 mt-1">Real-time monitoring of active livestreams</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">Auto-refresh</span>
          </label>
          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold animate-pulse">
            🔴 {data?.streams?.length || 0} Live
          </div>
        </div>
      </div>

      {/* Live Streams Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : data?.streams?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No live streams at the moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.map((stream: any) => (
            <div key={stream._id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
              {/* Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
                {stream.thumbnailUrl ? (
                  <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Users className="text-white opacity-50" size={64} />
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded animate-pulse">
                  🔴 LIVE
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 bg-black bg-opacity-50 text-white text-xs font-semibold rounded">
                  {stream.viewerCount} watching
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{stream.title}</h3>
                
                {/* Host */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    {stream.hostId?.profilePicture ? (
                      <img
                        src={stream.hostId.profilePicture}
                        alt={stream.hostId.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-purple-600 text-xs font-semibold">
                        {stream.hostId?.name?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-700">{stream.hostId?.name}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Viewers</div>
                    <div className="text-sm font-semibold text-gray-900">{stream.viewerCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Peak</div>
                    <div className="text-sm font-semibold text-gray-900">{stream.peakViewers}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Revenue</div>
                    <div className="text-sm font-semibold text-gray-900">₹{stream.totalRevenue || 0}</div>
                  </div>
                </div>

                {/* Current State */}
                <div className="mb-3">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    stream.currentState === 'on_call' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {stream.currentState === 'on_call' ? '📞 On Call' : '🎥 Streaming'}
                  </span>
                  {stream.currentCall?.isOnCall && (
                    <span className="ml-2 text-xs text-gray-600">
                      with {stream.currentCall.callerName}
                    </span>
                  )}
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    {formatDuration(stream.startedAt)}
                  </div>
                  <div>{stream.callWaitlist?.filter((r: any) => r.status === 'waiting').length || 0} in queue</div>
                </div>

                {/* Action Button */}
                <Link
                  href={`/livestreams/${stream.streamId}`}
                  className="block w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Eye size={16} className="inline mr-1" />
                  Monitor Stream
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
