'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send, Users, Star, AlertCircle, Image, Link as LinkIcon } from 'lucide-react';

type RecipientType = 'all_users' | 'all_astrologers' | 'specific_users';
type RecipientModel = 'User' | 'Astrologer';

export default function BroadcastPage() {
const queryClient = useQueryClient();
const [recipientType, setRecipientType] = useState<RecipientType>('all_users');
const [specificUserIds, setSpecificUserIds] = useState('');
const [recipientModel, setRecipientModel] = useState<RecipientModel>('User');

const [formData, setFormData] = useState({
type: 'system_announcement',
title: '',
message: '',
priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
imageUrl: '',
actionUrl: '',
fullScreen: false,
});

const broadcastMutation = useMutation({
mutationFn: async () => {
if (formData.fullScreen) {
if (!specificUserIds.trim()) {
throw new Error('Full-screen notifications require a specific recipient ID');
}
const recipientIds = specificUserIds.split(',').map(id => id.trim()).filter(Boolean);
if (recipientIds.length === 0) {
  throw new Error('Full-screen notifications require a specific recipient ID');
}
if (recipientIds.length > 1) {
  throw new Error('Full-screen notifications accept only a single recipient ID');
}
const recipientId = recipientIds[0];
    return adminApi.sendFullScreenNotification({
      recipientId,
      recipientModel,
      type: formData.type,
      title: formData.title,
      message: formData.message,
      data: {},
      imageUrl: formData.imageUrl,
      actionUrl: formData.actionUrl,
    });
  }

  const dataToSend = {
    type: formData.type,
    title: formData.title,
    message: formData.message,
    priority: formData.priority,
    imageUrl: formData.imageUrl,
    actionUrl: formData.actionUrl,
  };

  if (recipientType === 'specific_users') {
    const userIds = specificUserIds.split(',').map(id => id.trim()).filter(Boolean);
    if (userIds.length === 0) {
      throw new Error('Please enter at least one user ID');
    }
    return adminApi.broadcastToSpecificUsers({ userIds, ...dataToSend });
  } else {
    return adminApi.broadcastToAllUsers(dataToSend);
  }
},
onSuccess: (response) => {
  const sent = response.data.data?.sent || 1;
  toast.success(`✅ ${formData.fullScreen ? 'Full-screen notification' : 'Broadcast'} sent to ${sent} recipient(s)!`);
  
  setFormData({
    type: 'system_announcement',
    title: '',
    message: '',
    priority: 'medium',
    imageUrl: '',
    actionUrl: '',
    fullScreen: false,
  });
  setSpecificUserIds('');
  setRecipientModel('User');
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
},
onError: (error: any) => {
  const errorMessage = error.response?.data?.message || error.message || 'Failed to send notification';
  toast.error(`❌ ${errorMessage}`);
},
});

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
if (!formData.title.trim() || !formData.message.trim()) {
  toast.error('Please fill in all required fields');
  return;
}

if (formData.fullScreen && !specificUserIds.trim()) {
  toast.error('Full-screen notifications require a specific recipient ID');
  return;
}

if (recipientType === 'specific_users' && !formData.fullScreen && !specificUserIds.trim()) {
  toast.error('Please enter user IDs for specific users');
  return;
}

broadcastMutation.mutate();
};

return (
<div className="space-y-6">
<div>
<h1 className="text-3xl font-bold text-gray-900">Broadcast Notification</h1>
<p className="text-gray-600 mt-1">Send instant notifications to users</p>
</div>
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
    <div>
      <p className="text-sm text-blue-800 font-medium">Broadcast Tips</p>
      <p className="text-sm text-blue-700 mt-1">
        Notifications will be sent via FCM (for closed apps) and Socket.io (for active users). 
        Choose priority carefully - urgent notifications will have sound, vibration and full-screen if configured.
      </p>
    </div>
  </div>

  <form onSubmit={handleSubmit} className="space-y-6">
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Users className="mr-2" size={20} />
        Select Recipients
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => {
            setRecipientType('all_users');
            setFormData({ ...formData, fullScreen: false });
          }}
          disabled={formData.fullScreen}
          className={`p-4 border-2 rounded-lg transition-all ${
            recipientType === 'all_users'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${formData.fullScreen ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Users className={`mx-auto mb-2 ${recipientType === 'all_users' ? 'text-indigo-600' : 'text-gray-400'}`} size={32} />
          <p className={`font-medium ${recipientType === 'all_users' ? 'text-indigo-600' : 'text-gray-700'}`}>
            All Users
          </p>
          <p className="text-xs text-gray-500 mt-1">Broadcast to all app users</p>
        </button>

        <button
          type="button"
          onClick={() => {
            setRecipientType('all_astrologers');
            setFormData({ ...formData, fullScreen: false });
          }}
          disabled={formData.fullScreen}
          className={`p-4 border-2 rounded-lg transition-all ${
            recipientType === 'all_astrologers'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          } ${formData.fullScreen ? 'opacity-50 cursor-not-allowed' : ''}`}
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

      {recipientType === 'specific_users' && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.fullScreen ? 'Recipient ID (single)' : 'User IDs (comma-separated)'}
            </label>
            <textarea
              value={specificUserIds}
              onChange={(e) => setSpecificUserIds(e.target.value)}
              placeholder={formData.fullScreen ? "Enter single recipient ID" : "Enter user IDs separated by commas"}
              rows={formData.fullScreen ? 1 : 3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.fullScreen ? 'Enter a single MongoDB ObjectId' : 'Enter MongoDB ObjectIds or user IDs'}
            </p>
          </div>

          {formData.fullScreen && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientModel('User')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    recipientModel === 'User'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientModel('Astrologer')}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    recipientModel === 'Astrologer'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Astrologer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Details</h2>
      
      <div className="space-y-4">
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
            <option value="call_incoming">📞 Incoming Call</option>
            <option value="order_completed">✅ Order Update</option>
            <option value="payment_success">💰 Payment Update</option>
            <option value="stream_started">🎥 Livestream Alert</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['low', 'medium', 'high', 'urgent'].map((priority) => (
              <button
                key={priority}
                type="button"
                disabled={formData.fullScreen}
                onClick={() => setFormData({ ...formData, priority: priority as any })}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  formData.priority === priority || (formData.fullScreen && priority === 'urgent')
                    ? priority === 'urgent'
                      ? 'bg-red-600 text-white'
                      : priority === 'high'
                      ? 'bg-orange-600 text-white'
                      : priority === 'medium'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${formData.fullScreen ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
            ))}
          </div>
          {formData.fullScreen && (
            <p className="text-xs text-gray-500 mt-2">Full-screen notifications are always urgent priority</p>
          )}
        </div>

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

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.fullScreen}
              onChange={(e) => {
                const isChecked = e.target.checked;
                setFormData({ ...formData, fullScreen: isChecked, priority: isChecked ? 'urgent' : 'medium' });
                if (isChecked) {
                  setRecipientType('specific_users');
                }
              }}
              className="form-checkbox h-5 w-5 text-indigo-600"
            />
            <span className="text-gray-700 text-sm font-medium">
              Send as full-screen notification (urgent priority, single recipient only)
            </span>
          </label>
          {formData.fullScreen && (
            <p className="text-xs text-yellow-700 mt-2">
              ⚠️ Full-screen notifications can only be sent to one specific User or Astrologer at a time.
            </p>
          )}
        </div>

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

    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>

      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-start gap-3">
          <div className="text-2xl">
            {formData.type === 'system_announcement' && '📢'}
            {formData.type === 'general' && '📬'}
            {formData.type === 'call_incoming' && '📞'}
            {formData.type === 'order_completed' && '✅'}
            {formData.type === 'payment_success' && '💰'}
            {formData.type === 'stream_started' && '🎥'}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">
                {formData.title || 'Notification Title'}
              </p>
              {(formData.priority === 'urgent' || formData.fullScreen) && (
                <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                  Urgent
                </span>
              )}
              {formData.priority === 'high' && !formData.fullScreen && (
                <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">
                  High
                </span>
              )}
              {formData.fullScreen && (
                <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
                  Full Screen
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
            fullScreen: false,
          });
          setSpecificUserIds('');
          setRecipientModel('User');
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
            <span>Send {formData.fullScreen ? 'Full-Screen ' : ''}Broadcast</span>
          </>
        )}
      </button>
    </div>
  </form>
</div>
);
}