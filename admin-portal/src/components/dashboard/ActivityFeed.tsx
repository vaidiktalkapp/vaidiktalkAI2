'use client';

import { useEffect, useState } from 'react';
import { getAdminSocket } from '@/lib/socket'; // Using your existing socket lib
import { Bell, ShoppingBag, UserPlus, Wifi } from 'lucide-react';

interface Activity {
  id: string;
  type: 'order' | 'user' | 'stream' | 'system';
  message: string;
  time: Date;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getAdminSocket();

    if (socket) {
      setIsConnected(socket.connected);

      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));

      // Listen for real events
      socket.on('admin-activity', (data: any) => {
        const newActivity: Activity = {
          id: Date.now().toString(),
          type: data.type || 'system',
          message: data.message,
          time: new Date(),
        };
        setActivities((prev) => [newActivity, ...prev].slice(0, 10)); // Keep last 10
      });
    }

    return () => {
      socket?.off('admin-activity');
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-gray-900">Live Activity</h3>
        <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
          <Wifi size={14} />
          {isConnected ? 'Live' : 'Disconnected'}
        </div>
      </div>
      
      <div className="p-4 overflow-y-auto max-h-[400px] space-y-4">
        {activities.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Waiting for events...</p>
        ) : (
          activities.map((item) => (
            <div key={item.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
              <div className={`mt-1 p-2 rounded-full shrink-0 ${
                item.type === 'order' ? 'bg-blue-50 text-blue-600' :
                item.type === 'user' ? 'bg-green-50 text-green-600' :
                'bg-gray-50 text-gray-600'
              }`}>
                {item.type === 'order' && <ShoppingBag size={14} />}
                {item.type === 'user' && <UserPlus size={14} />}
                {item.type === 'stream' && <Wifi size={14} />}
                {item.type === 'system' && <Bell size={14} />}
              </div>
              <div>
                <p className="text-sm text-gray-800">{item.message}</p>
                <p className="text-xs text-gray-400 mt-1">{item.time.toLocaleTimeString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
