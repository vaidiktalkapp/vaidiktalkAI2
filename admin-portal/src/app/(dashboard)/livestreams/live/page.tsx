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
  // Add state to force re-render for timers every second
  const [, setTick] = useState(0);

  // Fetch live streams
  const { data, isLoading } = useQuery({
    queryKey: ['live-streams'],
    queryFn: async () => {
      const response = await adminApi.getLiveStreams({ page: 1, limit: 50 });
      return response.data.data; // Expected: { streams: [], total: number }
    },
    refetchInterval: autoRefresh ? 5000 : false,
  });

  // Effect to update timers every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (startedAt: string) => {
    if (!startedAt) return '00:00';
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const diff = Math.max(0, Math.floor((now - start) / 1000));

    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;

    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      : `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Safely access streams array
  const streams = data?.streams || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Streams</h1>
            <p className="text-gray-600 mt-1">Real-time monitoring of active livestreams</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-medium text-gray-700">Auto-refresh</span>
          </label>
          <div className="px-4 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            {streams.length} Live
          </div>
        </div>
      </div>

      {/* Live Streams Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-gray-500">Loading active streams...</p>
        </div>
      ) : streams.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No active livestreams</h3>
          <p className="mt-1 text-gray-500">There are currently no astrologers streaming live.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* ✅ Fixed: Mapping over `streams` instead of `data` */}
          {streams.map((stream: any) => (
            <div key={stream._id || stream.streamId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-900 group-hover:opacity-95 transition-opacity">
                {stream.thumbnailUrl ? (
                  <img src={stream.thumbnailUrl} alt={stream.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/50">
                    <Users size={48} className="mb-2" />
                    <span className="text-xs font-medium uppercase tracking-wider">No Thumbnail</span>
                  </div>
                )}

                {/* Live Badge */}
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </div>

                {/* Viewer Count */}
                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md flex items-center gap-1.5 border border-white/10">
                  <Eye size={12} />
                  {stream.viewerCount || 0}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-1 flex-1" title={stream.title}>
                    {stream.title || 'Untitled Stream'}
                  </h3>
                </div>

                {/* Host Info */}
                <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-indigo-200">
                    {stream.hostId?.profilePicture ? (
                      <img
                        src={stream.hostId.profilePicture}
                        alt={stream.hostId.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-indigo-700 text-xs font-bold">
                        {stream.hostId?.name?.charAt(0) || 'A'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {stream.hostId?.name || 'Unknown Host'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Astrologer
                    </p>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-50 rounded p-2 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">Peak Viewers</p>
                    <p className="text-sm font-bold text-gray-900">{stream.peakViewers || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded p-2 text-center border border-green-100">
                    <p className="text-[10px] uppercase tracking-wide text-green-600 font-semibold">Revenue</p>
                    <p className="text-sm font-bold text-green-700">{stream.totalRevenue || 0} ₹</p>
                  </div>
                </div>

                {/* Footer: Duration & Action */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    <Clock size={12} className="mr-1.5" />
                    {formatDuration(stream.startedAt)}
                  </div>

                  <Link
                    href={`/livestreams/${stream.streamId || stream._id}`}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                  >
                    Monitor →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}