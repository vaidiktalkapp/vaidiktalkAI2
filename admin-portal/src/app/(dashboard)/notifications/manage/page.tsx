// app/(dashboard)/notifications/manage/page.tsx (NEW)
'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function NotificationManagePage() {
  const [testLoading, setTestLoading] = useState(false);
  const [alertLoading, setAlertLoading] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      await adminApi.testNotification();
      toast.success('✅ Test notification sent to all connected admins!');
    } catch (error: any) {
      toast.error('❌ Failed to send test notification');
      console.error(error.response?.data || error.message);
    } finally {
      setTestLoading(false);
    }
  };

  const handleSystemAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) {
      toast.error('Please enter an alert message');
      return;
    }

    setAlertLoading(true);
    try {
      await adminApi.sendSystemAlert({ message: alertMessage });
      toast.success('🚨 System alert broadcasted!');
      setAlertMessage('');
    } catch (error: any) {
      toast.error('❌ Failed to send system alert');
      console.error(error.response?.data || error.message);
    } finally {
      setAlertLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
        <p className="text-gray-600 mt-2">Manage and send notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <Link
                href="/notifications/broadcast"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-3xl">📢</div>
                <div>
                  <p className="font-medium text-gray-900">Broadcast Message</p>
                  <p className="text-sm text-gray-600">Send to all users instantly</p>
                </div>
              </Link>

              <Link
                href="/notifications/schedule"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-3xl">⏰</div>
                <div>
                  <p className="font-medium text-gray-900">Schedule Notification</p>
                  <p className="text-sm text-gray-600">Schedule for later</p>
                </div>
              </Link>

              <Link
                href="/notifications/scheduled"
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-3xl">📅</div>
                <div>
                  <p className="font-medium text-gray-900">View Scheduled</p>
                  <p className="text-sm text-gray-600">Manage scheduled notifications</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Test Notification */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Notification</h2>
            <p className="text-sm text-gray-600 mb-4">
              Send a test notification to all connected admin devices
            </p>
            <button
              onClick={handleTestNotification}
              disabled={testLoading}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {testLoading ? 'Sending...' : 'Send Test Notification'}
            </button>
          </div>
        </div>

        {/* System Alert */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border-red-200 border-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="text-2xl">🚨</div>
              <h2 className="text-lg font-semibold text-gray-900">System Alert</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Broadcast a high-priority system alert to all admins
            </p>

            <form onSubmit={handleSystemAlert}>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Enter system alert message..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                required
              />
              
              <button
                type="submit"
                disabled={alertLoading}
                className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {alertLoading ? 'Broadcasting...' : 'Broadcast System Alert 🚨'}
              </button>
            </form>
          </div>

          {/* Notification Templates */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Templates</h2>
            
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Maintenance Notice</p>
                <p className="text-xs text-gray-600 mt-1">
                  "System maintenance scheduled for [time]. Services may be temporarily unavailable."
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">New Feature Launch</p>
                <p className="text-xs text-gray-600 mt-1">
                  "🎉 New feature available! Check out [feature name] in your dashboard."
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Promotion Announcement</p>
                <p className="text-xs text-gray-600 mt-1">
                  "Special offer! Get [discount]% off on all services. Limited time only!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
