'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { TrendingUp, Users, DollarSign, Video, Award } from 'lucide-react';

export default function StreamAnalyticsPage() {
  // Fetch top streams
  const { data: topStreams } = useQuery({
    queryKey: ['top-streams'],
    queryFn: async () => {
      const response = await adminApi.getTopStreams(10);
      return response.data.data;
    },
  });

  // Fetch top earners
  const { data: topEarners } = useQuery({
    queryKey: ['top-stream-earners'],
    queryFn: async () => {
      const response = await adminApi.getTopStreamEarners(10);
      return response.data.data;
    },
  });

  // Fetch global stats
  const { data: stats } = useQuery({
    queryKey: ['stream-stats'],
    queryFn: async () => {
      const response = await adminApi.getStreamStats();
      return response.data.data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Livestream Analytics</h1>
        <p className="text-gray-600 mt-1">Performance insights and top performers</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Streams</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStreams || 0}</p>
            </div>
            <Video className="text-indigo-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-blue-600">{(stats?.totalViews || 0).toLocaleString()}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{(stats?.totalRevenue || 0).toLocaleString()}</p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Calls</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.totalCalls || 0}</p>
            </div>
            <TrendingUp className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Top Performing Streams */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="mr-2 text-yellow-600" size={24} />
          Top Performing Streams
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stream</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Astrologer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Peak Viewers</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Calls</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topStreams?.map((stream: any, index: number) => (
                <tr key={stream._id} className={index < 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-4 py-3">
                    <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{stream.title}</div>
                    <div className="text-xs text-gray-500">{stream.streamId}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{stream.hostId?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{stream.totalViews?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{stream.peakViewers}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">
                    ₹{stream.totalRevenue?.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{stream.totalCalls || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Earning Astrologers */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="mr-2 text-green-600" size={24} />
          Top Earning Astrologers (Livestreams)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Astrologer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Streams</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Views</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Calls</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topEarners?.map((earner: any, index: number) => (
                <tr key={earner._id} className={index < 3 ? 'bg-green-50' : ''}>
                  <td className="px-4 py-3">
                    <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden">
                        {earner.astrologer?.profilePicture ? (
                          <img
                            src={earner.astrologer.profilePicture}
                            alt={earner.astrologer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-purple-600 text-xs font-semibold">
                            {earner.astrologer?.name?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{earner.astrologer?.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{earner.totalStreams}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{earner.totalViews?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{earner.totalCalls || 0}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">
                    ₹{earner.totalRevenue?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
