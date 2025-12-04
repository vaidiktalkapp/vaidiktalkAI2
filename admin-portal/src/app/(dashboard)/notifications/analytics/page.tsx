// app/(dashboard)/notifications/analytics/page.tsx (NEW)
'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import NotificationStats from '@/components/notifications/NotificationStats';

export default function NotificationAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminApi.getNotificationStats();
      setStats(response.data.data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Analytics</h1>
        <p className="text-gray-600 mt-2">Track notification performance and engagement</p>
      </div>

      {/* Stats Overview */}
      <NotificationStats />

      {/* By Type Breakdown */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Notifications by Type</h2>
        
        {stats?.byType && stats.byType.length > 0 ? (
          <div className="space-y-3">
            {stats.byType.map((item: any) => (
              <div key={item._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getTypeIcon(item._id)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {item._id.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.count} notification{item.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{item.count}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {/* Delivery Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Methods</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📱</span>
                <span className="text-gray-700">FCM Push</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats?.total || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <span className="text-gray-700">Socket.io (Real-time)</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {stats?.connectedUsers || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <span className="text-gray-700">Read</span>
              </div>
              <span className="text-lg font-semibold text-green-600">
                {(stats?.total || 0) - (stats?.unread || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔔</span>
                <span className="text-gray-700">Unread</span>
              </div>
              <span className="text-lg font-semibold text-orange-600">
                {stats?.unread || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    // 🆕 NEW REFINED TYPES
    call_video: '📹',
    call_audio: '📞',
    message_direct: '✉️',
    chat_group: '💬',
    live_event_started: '🔴',
    live_event_reminder: '⏰',
    system_promotional: '🎁',
    force_logout: '🔒',
    
    // ✅ EXISTING TYPES
    chat_message: '💬',
    call_incoming: '📞',
    call_missed: '📴',
    call_ended: '📴',
    order_created: '🛒',
    order_completed: '✅',
    payment_success: '💰',
    wallet_recharged: '💳',
    stream_started: '🎥',
    stream_reminder: '⏰',
    stream_ended: '🎬',
    gift_received: '🎁',
    astrologer_approved: '✅',
    astrologer_rejected: '❌',
    payout_processed: '💸',
    admin_alert: '⚠️',
    system_announcement: '📢',
    general: '🔔',
  };
  return icons[type] || '📬';
}

