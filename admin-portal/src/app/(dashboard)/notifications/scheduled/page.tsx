// app/(dashboard)/notifications/scheduled/page.tsx (NEW)
'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ScheduledNotification {
  scheduleId: string;
  scheduledFor: Date;
  status: string;
  type: string;
  title: string;
  message: string;
  recipientType: string;
  createdAt: Date;
}

export default function ScheduledNotificationsPage() {
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');

  useEffect(() => {
    loadNotifications();
  }, [statusFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getScheduledNotifications({
        status: statusFilter,
        page: 1,
        limit: 50,
      });
      setNotifications(response.data.data.notifications);
    } catch (error: any) {
      toast.error('Failed to load scheduled notifications');
      console.error(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled notification?')) {
      return;
    }

    try {
      await adminApi.cancelScheduledNotification(scheduleId);
      toast.success('✅ Notification cancelled');
      loadNotifications();
    } catch (error: any) {
      toast.error('Failed to cancel notification');
      console.error(error.response?.data || error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scheduled Notifications</h1>
        <p className="text-gray-600 mt-2">View and manage scheduled notifications</p>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-gray-600">No scheduled notifications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.scheduleId}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{notif.title}</h3>
                    {getStatusBadge(notif.status)}
                  </div>

                  <p className="text-gray-600 text-sm mb-3">{notif.message}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Scheduled For:</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(notif.scheduledFor), 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Recipient:</p>
                      <p className="font-medium text-gray-900">{notif.recipientType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Type:</p>
                      <p className="font-medium text-gray-900">{notif.type}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Created:</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(notif.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {notif.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(notif.scheduleId)}
                    className="ml-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
