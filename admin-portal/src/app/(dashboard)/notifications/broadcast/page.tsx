// app/(dashboard)/notifications/broadcast/page.tsx (MATCHING YOUR DESIGN)
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Users, Star, AlertCircle, Image, Link as LinkIcon } from 'lucide-react';

type RecipientType = 'all_users' | 'all_astrologers' | 'specific_users';

export default function BroadcastPage() {
  const queryClient = useQueryClient();
  const [recipientType, setRecipientType] = useState<RecipientType>('all_users');
  const [specificUserIds, setSpecificUserIds] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'system_announcement',
    title: '',
    message: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    imageUrl: '',
    actionUrl: '',
  });

  // Broadcast mutation
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      if (recipientType === 'specific_users') {
        const userIds = specificUserIds.split(',').map(id => id.trim()).filter(Boolean);
        if (userIds.length === 0) {
          throw new Error('Please enter at least one user ID');
        }
        return adminApi.broadcastToSpecificUsers({ userIds, ...formData });
      } else if (recipientType === 'all_astrologers') {
        // For astrologers, we'll use the all_users endpoint but modify the backend
        // Or create a separate endpoint for astrologers
        return adminApi.broadcastToAllUsers(formData);
      } else {
        return adminApi.broadcastToAllUsers(formData);
      }
    },
    onSuccess: (response) => {
      const sent = response.data.data.sent || 0;
      toast.success(`✅ Broadcast sent to ${sent} ${recipientType === 'all_astrologers' ? 'astrologers' : 'users'}!`);
      
      // Reset form
      setFormData({
        type: 'system_announcement',
        title: '',
        message: '',
        priority: 'medium',
        imageUrl: '',
        actionUrl: '',
      });
      setSpecificUserIds('');
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send broadcast';
      toast.error(`❌ ${errorMessage}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (recipientType === 'specific_users' && !specificUserIds.trim()) {
      toast.error('Please enter user IDs for specific users');
      return;
    }

    broadcastMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Broadcast Notification</h1>
        <p className="text-gray-600 mt-1">Send instant notifications to users</p>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-sm text-blue-800 font-medium">Broadcast Tips</p>
          <p className="text-sm text-blue-700 mt-1">
            Notifications will be sent via FCM (for closed apps) and Socket.io (for active users). 
            Choose priority carefully - urgent notifications will have sound and vibration.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="mr-2" size={20} />
            Select Recipients
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setRecipientType('all_users')}
              className={`p-4 border-2 rounded-lg transition-all ${
                recipientType === 'all_users'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className={`mx-auto mb-2 ${recipientType === 'all_users' ? 'text-indigo-600' : 'text-gray-400'}`} size={32} />
              <p className={`font-medium ${recipientType === 'all_users' ? 'text-indigo-600' : 'text-gray-700'}`}>
                All Users
              </p>
              <p className="text-xs text-gray-500 mt-1">Broadcast to all app users</p>
            </button>

            <button
              type="button"
              onClick={() => setRecipientType('all_astrologers')}
              className={`p-4 border-2 rounded-lg transition-all ${
                recipientType === 'all_astrologers'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Star className={`mx-auto mb-2 ${recipientType === 'all_astrologers' ? 'text-indigo-600' : 'text-gray-400'}`} size={32} />
              <p className={`font-medium ${recipientType === 'all_astrologers' ? 'text-indigo-600' : 'text-gray-700'}`}>
                All Astrologers
              </p>
              <p className="text-xs text-gray-500 mt-1">Broadcast to all astrologers</p>
            </button>

            <button
              type="button"
              onClick={() => setRecipientType('specific_users')}
              className={`p-4 border-2 rounded-lg transition-all ${
                recipientType === 'specific_users'
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className={`mx-auto mb-2 ${recipientType === 'specific_users' ? 'text-indigo-600' : 'text-gray-400'}`} size={32} />
              <p className={`font-medium ${recipientType === 'specific_users' ? 'text-indigo-600' : 'text-gray-700'}`}>
                Specific Users
              </p>
              <p className="text-xs text-gray-500 mt-1">Target specific user IDs</p>
            </button>
          </div>

          {/* Specific Users Input */}
          {recipientType === 'specific_users' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User IDs (comma-separated)
              </label>
              <textarea
                value={specificUserIds}
                onChange={(e) => setSpecificUserIds(e.target.value)}
                placeholder="Enter user IDs separated by commas (e.g., user1, user2, user3)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter MongoDB ObjectIds or user IDs
              </p>
            </div>
          )}
        </div>

        {/* Notification Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Details</h2>
          
          <div className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="system_announcement">📢 System Announcement</option>
                <option value="general">📬 General Notification</option>
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
                {['low', 'medium', 'high', 'urgent'].map((priority) => (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: priority as any })}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{formData.message.length}/1000 characters</p>
            </div>

            {/* Image URL */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Image className="mr-2" size={16} />
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Add an image to make the notification more engaging</p>
            </div>

            {/* Action URL */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <LinkIcon className="mr-2" size={16} />
                Action URL (Optional)
              </label>
              <input
                type="text"
                value={formData.actionUrl}
                onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                placeholder="/orders/123 or /livestream/456"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">Deep link to navigate when notification is tapped</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {formData.type === 'system_announcement' && '📢'}
                {formData.type === 'general' && '📬'}
                {formData.type === 'order_completed' && '✅'}
                {formData.type === 'payment_success' && '💰'}
                {formData.type === 'stream_started' && '🎥'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">
                    {formData.title || 'Notification Title'}
                  </p>
                  {formData.priority === 'urgent' && (
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                      Urgent
                    </span>
                  )}
                  {formData.priority === 'high' && (
                    <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                      High
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {formData.message || 'Your notification message will appear here...'}
                </p>
                {formData.imageUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="h-32 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">Just now</p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setFormData({
                type: 'system_announcement',
                title: '',
                message: '',
                priority: 'medium',
                imageUrl: '',
                actionUrl: '',
              });
              setSpecificUserIds('');
            }}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={broadcastMutation.isPending}
            className="flex items-center space-x-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {broadcastMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Send Broadcast</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
