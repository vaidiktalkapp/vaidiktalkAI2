// components/widgets/LiveStatsWidget.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { TrendingUp, Users, Video, Coins } from 'lucide-react';

export default function LiveStatsWidget() {
  const { data: liveStats } = useQuery({
    queryKey: ['live-stats'],
    queryFn: async () => {
      const response = await adminApi.getStreamStats();
      return response.data.data;
    },
    refetchInterval: 5000, // ✅ Real-time refresh
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Active Users Right Now */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">🟢 Online Now</p>
            <p className="text-3xl font-bold text-gray-900 animate-pulse">
              {liveStats?.onlineUsers || 0}
            </p>
            <p className="text-xs text-green-600 mt-1">
              +{liveStats?.userGrowthToday || 0} today
            </p>
          </div>
          <Users className="text-green-500" size={40} />
        </div>
      </div>

      {/* Live Streams Count */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">🔴 Live Streams</p>
            <p className="text-3xl font-bold text-gray-900">
              {liveStats?.activeStreams || 0}
            </p>
            <p className="text-xs text-red-600 mt-1">
              {liveStats?.totalViewers || 0} watching
            </p>
          </div>
          <Video className="text-red-500" size={40} />
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">💬 Active Sessions</p>
            <p className="text-3xl font-bold text-gray-900">
              {liveStats?.activeSessions || 0}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {liveStats?.pendingOrders || 0} pending
            </p>
          </div>
          <TrendingUp className="text-blue-500" size={40} />
        </div>
      </div>

      {/* Today's Revenue */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">💰 Today's Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              {(liveStats?.revenueToday || 0).toLocaleString()} Cr
            </p>
            <p className="text-xs text-purple-600 mt-1">
              {liveStats?.ordersToday || 0} orders
            </p>
          </div>
          <Coins className="text-purple-500" size={40} />
        </div>
      </div>
    </div>
  );
}
