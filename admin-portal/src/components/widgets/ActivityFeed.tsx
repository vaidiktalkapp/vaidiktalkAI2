// components/widgets/ActivityFeed.tsx
'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export default function ActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);

    socket.on('admin:activity', (activity) => {
      setActivities(prev => [activity, ...prev].slice(0, 20));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      user_registered: '👤',
      order_completed: '✅',
      stream_started: '🔴',
      payout_requested: '💰',
      astrologer_approved: '⭐',
      refund_issued: '↩️',
    };
    return icons[type] || '📌';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Activity Feed
        </h3>
      </div>
      <div className="divide-y max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-2xl">{getActivityIcon(activity.type)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(activity.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
