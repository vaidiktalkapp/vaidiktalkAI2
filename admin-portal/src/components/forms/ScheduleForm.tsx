// components/forms/ScheduleForm.tsx (UPDATED - Use existing API)
'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api'; // ✅ Use existing API
import toast from 'react-hot-toast';

export default function ScheduleForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'stream_reminder',
    title: '',
    message: '',
    priority: 'high' as 'low' | 'medium' | 'high' | 'urgent',
    scheduledFor: '',
    recipientType: 'all_users' as 'all_users' | 'all_astrologers' | 'specific_users' | 'followers',
    imageUrl: '',
    actionUrl: '',
    astrologerId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.scheduledFor) {
      toast.error('Please select a scheduled time');
      return;
    }

    if (formData.recipientType === 'followers' && !formData.astrologerId.trim()) {
      toast.error('Please enter an astrologer ID');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        ...(formData.recipientType === 'followers' 
          ? { astrologerId: formData.astrologerId }
          : { astrologerId: undefined }
        ),
      };

      const response = await adminApi.scheduleNotification(payload);
      
      toast.success('✅ Notification scheduled successfully!');
      
      // Reset form
      setFormData({
        type: 'stream_reminder',
        title: '',
        message: '',
        priority: 'high',
        scheduledFor: '',
        recipientType: 'all_users',
        imageUrl: '',
        actionUrl: '',
        astrologerId: '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule notification';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Get minimum datetime (now + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Schedule Notification</h2>

      <div className="space-y-4">
        {/* Scheduled Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Scheduled Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledFor}
            onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
            min={getMinDateTime()}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">⏰ Minimum 5 minutes from now</p>
        </div>

        {/* Recipient Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Send To <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.recipientType}
            onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="all_users">👥 All Users</option>
            <option value="all_astrologers">⭐ All Astrologers</option>
            <option value="specific_users">🎯 Specific Users</option>
            <option value="followers">❤️ Astrologer's Followers</option>
          </select>
        </div>

        {/* Astrologer ID (if followers selected) */}
        {formData.recipientType === 'followers' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Astrologer ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.astrologerId}
              onChange={(e) => setFormData({ ...formData, astrologerId: e.target.value })}
              placeholder="Enter astrologer's MongoDB ObjectId"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={formData.recipientType === 'followers'}
            />
            <p className="text-xs text-gray-500 mt-1">Notification will be sent to all users following this astrologer</p>
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="stream_reminder">⏰ Livestream Reminder</option>
            <option value="stream_started">🎥 Livestream Started</option>
            <option value="system_announcement">📢 System Announcement</option>
            <option value="general">🔔 General</option>
            <option value="order_completed">✅ Order Update</option>
            <option value="payment_success">💰 Payment Update</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="low">🟢 Low</option>
            <option value="medium">🔵 Medium</option>
            <option value="high">🟠 High</option>
            <option value="urgent">🔴 Urgent</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter notification title"
            maxLength={200}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200 characters</p>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Enter notification message"
            maxLength={1000}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{formData.message.length}/1000 characters</p>
        </div>

        {/* Image URL (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL (Optional)
          </label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action URL (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Action URL (Optional)
          </label>
          <input
            type="text"
            value={formData.actionUrl}
            onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
            placeholder="/orders/123 or /livestream/456"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Deep link to navigate when notification is tapped</p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              <span>Scheduling...</span>
            </>
          ) : (
            <>
              <span>⏰</span>
              <span>Schedule Notification</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
