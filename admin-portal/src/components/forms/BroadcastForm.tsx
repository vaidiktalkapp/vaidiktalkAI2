// components/forms/BroadcastForm.tsx (UPDATED - Use existing API)
'use client';

import { useState } from 'react';
import { adminApi } from '@/lib/api'; // ✅ Use existing API
import toast from 'react-hot-toast';

export default function BroadcastForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'system_announcement',
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    imageUrl: '',
    actionUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await adminApi.broadcastToAllUsers(formData);
      
      toast.success(`✅ Broadcast sent to ${response.data.data.sent} users!`);
      
      // Reset form
      setFormData({
        type: 'system_announcement',
        title: '',
        message: '',
        priority: 'medium',
        imageUrl: '',
        actionUrl: '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send broadcast';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-6">📢 Broadcast to All Users</h2>

      <div className="space-y-4">
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
            <option value="system_announcement">📢 System Announcement</option>
            <option value="general">🔔 General</option>
            <option value="order_completed">✅ Order Update</option>
            <option value="payment_success">💰 Payment Update</option>
            <option value="stream_started">🎥 Livestream Alert</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['low', 'medium', 'high', 'urgent'] as const).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({ ...formData, priority })}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.priority === priority
                    ? priority === 'urgent'
                      ? 'bg-red-600 text-white'
                      : priority === 'high'
                      ? 'bg-orange-600 text-white'
                      : priority === 'medium'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
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
          <p className="text-xs text-gray-500 mt-1">{formData.title.length}/200</p>
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
          <p className="text-xs text-gray-500 mt-1">{formData.message.length}/1000</p>
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
            placeholder="/orders/123"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
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
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>📤</span>
              <span>Send Broadcast</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
