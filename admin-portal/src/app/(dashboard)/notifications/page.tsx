'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/components/providers/NotificationProvider';
import NotificationItem from '@/components/notifications/NotificationItem';

interface Notification {
  notificationId: string;
  isRead: boolean;
  type: string;
  title: string;
  message: string;
  data?: { fullScreen?: boolean; actionUrl?: string };
  actionUrl?: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [fullScreenNotification, setFullScreenNotification] = useState<Notification | null>(null);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread' && notif.isRead) return false;
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;
    return true;
  });

  const notificationTypes = Array.from(new Set(notifications.map(n => n.type)));

  const onNotificationClick = (notification: Notification) => {
    markAsRead(notification.notificationId);

    if (notification.data?.fullScreen) {
      setFullScreenNotification(notification);
    } else if (notification.actionUrl || notification.data?.actionUrl) {
      router.push(notification.actionUrl || notification.data?.actionUrl || '/');
    }
  };

  const FullScreenModal: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full text-center shadow-lg">
        <h2 className="text-2xl font-bold mb-4">{notification.title}</h2>
        <p className="mb-6">{notification.message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
        <p className="text-gray-600 mt-2">All system notifications in one place</p>
      </div>

      {/* Stats Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Unread</p>
            <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Mark All Read
          </button>
          <button
            onClick={clearAll}
            disabled={notifications.length === 0}
            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap items-center gap-4">
        {/* Read/Unread Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Show:</label>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Types</option>
            {notificationTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600 text-lg">No notifications found</p>
          <p className="text-gray-400 text-sm mt-2">{filter === 'unread' ? "You're all caught up!" : 'Notifications will appear here'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
          {filteredNotifications.map((notification) => (
            <NotificationItem key={notification.notificationId} notification={notification} onClick={() => onNotificationClick(notification)} />
          ))}
        </div>
      )}

      {/* Full Screen Modal */}
      {fullScreenNotification && (
        <FullScreenModal notification={fullScreenNotification} onClose={() => setFullScreenNotification(null)} />
      )}
    </div>
  );
}
