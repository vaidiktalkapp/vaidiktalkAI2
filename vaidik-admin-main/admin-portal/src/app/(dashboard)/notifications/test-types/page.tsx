'use client';

import React, { useState } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';

export default function TestNotificationTypesPage() {
  const [loading, setLoading] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [recipientModel, setRecipientModel] = useState<'User' | 'Astrologer'>('User');

  const notificationTypes = [
    {
      category: '📞 Call Notifications',
      types: [
        {
          id: 'call_video',
          name: 'Video Call',
          icon: '📹',
          description: 'Full-screen video call notification',
          testData: {
            callerId: '507f1f77bcf86cd799439011',
            callerName: 'John Doe',
            callerAvatar: 'https://i.pravatar.cc/150?img=1',
            isVideo: true,
            callId: `call_${Date.now()}`,
            roomId: 'room_123',
          },
        },
        {
          id: 'call_audio',
          name: 'Audio Call',
          icon: '📞',
          description: 'Full-screen audio call notification',
          testData: {
            callerId: '507f1f77bcf86cd799439011',
            callerName: 'Sarah Smith',
            callerAvatar: 'https://i.pravatar.cc/150?img=5',
            isVideo: false,
            callId: `call_${Date.now()}`,
            roomId: 'room_456',
          },
        },
      ],
    },
    {
      category: '💬 Message & Chat',
      types: [
        {
          id: 'message_direct',
          name: 'Direct Message',
          icon: '✉️',
          description: 'In-app banner + heads-up notification',
          testData: {
            senderId: '507f1f77bcf86cd799439011',
            senderName: 'Mike Johnson',
            senderAvatar: 'https://i.pravatar.cc/150?img=3',
            messageText: 'Hey! How are you doing?',
            chatId: 'chat_123',
            messageId: `msg_${Date.now()}`,
          },
        },
        {
          id: 'chat_group',
          name: 'Group Chat',
          icon: '💬',
          description: 'In-app banner + heads-up notification',
          testData: {
            senderId: '507f1f77bcf86cd799439011',
            senderName: 'Emma Wilson',
            senderAvatar: 'https://i.pravatar.cc/150?img=9',
            messageText: 'Check out this amazing feature!',
            chatId: 'chat_789',
            groupName: 'Team Discussion',
          },
        },
      ],
    },
    {
      category: '🎥 Live Events',
      types: [
        {
          id: 'live_event_started',
          name: 'Live Event Started',
          icon: '🔴',
          description: 'In-app modal + heads-up notification',
          testData: {
            eventId: 'event_123',
            eventName: 'Vedic Astrology Masterclass',
            eventType: 'started',
            astrologerId: '507f1f77bcf86cd799439011',
            astrologerName: 'Guru Sharma',
            astrologerAvatar: 'https://i.pravatar.cc/150?img=12',
          },
        },
        {
          id: 'live_event_reminder',
          name: 'Event Reminder',
          icon: '⏰',
          description: 'In-app modal + heads-up notification',
          testData: {
            eventId: 'event_456',
            eventName: 'Horoscope Reading Session',
            eventType: 'reminder',
            eventStartTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            astrologerId: '507f1f77bcf86cd799439011',
            astrologerName: 'Pandit Kumar',
            astrologerAvatar: 'https://i.pravatar.cc/150?img=15',
          },
        },
      ],
    },
    {
      category: '📢 System & Security',
      types: [
        {
          id: 'system_promotional',
          name: 'Promotional',
          icon: '🎁',
          description: 'Toast/snackbar + standard notification',
          testData: {
            title: '🎉 Special Offer!',
            message: 'Get 50% off on your next consultation. Limited time only!',
            imageUrl: 'https://via.placeholder.com/400x200?text=Special+Offer',
            actionUrl: '/offers',
          },
        },
        {
          id: 'force_logout',
          name: 'Force Logout',
          icon: '🔒',
          description: 'Force modal + logout (foreground) | Silent logout (background)',
          testData: {
            reason: 'Your account has been accessed from another device. Please login again.',
          },
        },
      ],
    },
  ];

  const handleSendTest = async (typeId: string, testData: any) => {
    if (!recipientId.trim()) {
      toast.error('Please enter a recipient ID');
      return;
    }

    setLoading(true);
    try {
      const endpoint = `/admin/notifications/send/${typeId.replace('_', '-')}`;
      
      // Map type to API endpoint
      let apiMethod;
      switch (typeId) {
        case 'call_video':
        case 'call_audio':
          apiMethod = adminApi.sendCallNotification;
          break;
        case 'message_direct':
          apiMethod = adminApi.sendMessageNotification;
          break;
        case 'chat_group':
          // Use sendMessageNotification for now (or create separate method)
          apiMethod = adminApi.sendMessageNotification;
          break;
        case 'live_event_started':
        case 'live_event_reminder':
          apiMethod = adminApi.sendLiveEventNotification;
          break;
        case 'system_promotional':
          apiMethod = adminApi.sendSystemNotification;
          break;
        case 'force_logout':
          apiMethod = adminApi.forceLogoutUser;
          break;
        default:
          throw new Error('Unknown notification type');
      }

      await apiMethod({
        recipientId,
        recipientModel,
        ...testData,
      });

      toast.success(`✅ ${typeId.replace('_', ' ').toUpperCase()} notification sent!`);
    } catch (error: any) {
      toast.error(`❌ Failed: ${error.response?.data?.message || error.message}`);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test Notification Types</h1>
        <p className="text-gray-600 mt-2">Test all 6 refined notification types</p>
      </div>

      {/* Recipient Input */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Recipient</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Enter MongoDB ObjectId"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid User or Astrologer ID to receive test notifications
            </p>
          </div>
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
                    ? 'bg-blue-600 text-white'
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
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Astrologer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Types */}
      {notificationTypes.map((category) => (
        <div key={category.category} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{category.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.types.map((type) => (
              <div
                key={type.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{type.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{type.name}</p>
                      <p className="text-xs text-gray-500">{type.description}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleSendTest(type.id, type.testData)}
                  disabled={loading || !recipientId.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Send Test</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
