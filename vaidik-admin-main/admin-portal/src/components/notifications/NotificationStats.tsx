// components/notifications/NotificationStats.tsx (UPDATED - Use existing API)
'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api'; // ✅ Use existing API
import { useNotifications } from '../providers/NotificationProvider';

export default function NotificationStats() {
  const { isConnected } = useNotifications();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const [notifStatsRes, connStatsRes] = await Promise.all([
        adminApi.getNotificationStats(),
        adminApi.getNotificationConnectionStats(),
      ]);

      setStats({
        ...notifStatsRes.data.data,
        ...connStatsRes.data.data,
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Total Notifications */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Total Notifications</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</p>
          </div>
          <div className="text-4xl">📬</div>
        </div>
      </div>

      {/* Unread */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Unread</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{stats?.unread || 0}</p>
          </div>
          <div className="text-4xl">🔔</div>
        </div>
      </div>

      {/* Connected Users */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">Connected Users</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{stats?.connectedUsers || 0}</p>
          </div>
          <div className="text-4xl">👥</div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">System Status</p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-xl font-bold text-gray-900">
                {isConnected ? 'Live' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="text-4xl">{isConnected ? '✅' : '⚠️'}</div>
        </div>
      </div>
    </div>
  );
}
