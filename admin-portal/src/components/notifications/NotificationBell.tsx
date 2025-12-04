// components/NotificationBell.tsx (Next.js Admin)
'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../providers/NotificationProvider';
import Link from 'next/link';


export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notificationId: string) => {
    markAsRead(notificationId);
    // Optional: Navigate to relevant page based on notification type
  };

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
<div className="p-4 border-b">
  <div className="flex justify-between items-center mb-2">
    <h3 className="font-semibold text-lg">Notifications</h3>
    {notifications.length > 0 && (
      <button 
        onClick={clearAll}
        className="text-sm text-blue-600 hover:underline"
      >
        Clear all
      </button>
    )}
  </div>
  {/* 🆕 ADD: View All Link */}
  <Link
    href="/notifications"
    onClick={() => setIsOpen(false)}
    className="text-sm text-gray-600 hover:text-blue-600 flex items-center gap-1 transition-colors"
  >
    <span>View all notifications</span>
    <span>→</span>
  </Link>
</div>


            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.notificationId}
                    onClick={() => handleNotificationClick(notif.notificationId)}
                    className="p-4 border-b hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{notif.title}</p>
                          {notif.priority === 'urgent' && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                              Urgent
                            </span>
                          )}
                          {notif.priority === 'high' && (
                            <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full">
                              High
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notif.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
