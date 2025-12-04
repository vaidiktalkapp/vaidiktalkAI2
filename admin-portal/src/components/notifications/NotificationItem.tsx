// components/notifications/NotificationItem.tsx
'use client';

import { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  notification: Notification;
  onClick: () => void;
}

export default function NotificationItem({ notification, onClick }: Props) {
  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'urgent':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'high':
        return 'bg-orange-50 border-l-4 border-orange-500';
      case 'medium':
        return 'bg-blue-50 border-l-4 border-blue-500';
      default:
        return 'bg-gray-50 border-l-4 border-gray-300';
    }
  };

  const getTypeIcon = () => {
  const icons: Record<string, string> = {
    // 🆕 NEW REFINED TYPES
    call_video: '📹',
    call_audio: '📞',
    message_direct: '✉️',
    chat_group: '💬',
    live_event_started: '🔴',
    live_event_reminder: '⏰',
    system_promotional: '🎁',
    force_logout: '🔒',
    
    // ✅ EXISTING TYPES
    chat_message: '💬',
    call_incoming: '📞',
    call_missed: '📴',
    call_ended: '📴',
    order_created: '🛒',
    order_completed: '✅',
    payment_success: '💰',
    wallet_recharged: '💳',
    remedy_suggested: '🔮',
    report_ready: '📋',
    stream_started: '🎥',
    stream_reminder: '⏰',
    stream_ended: '🎬',
    gift_received: '🎁',
    astrologer_approved: '✅',
    astrologer_rejected: '❌',
    payout_processed: '💸',
    admin_alert: '⚠️',
    system_announcement: '📢',
    general: '🔔',
  };
  return icons[notification.type] || '🔔';
};


  return (
    <div
      onClick={onClick}
      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
        !notification.isRead ? 'bg-blue-50' : ''
      } ${getPriorityColor()}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl">
          {getTypeIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm text-gray-900 truncate">
              {notification.title}
            </p>
            {notification.priority === 'urgent' && (
              <span className="flex-shrink-0 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full font-medium">
                Urgent
              </span>
            )}
          </div>

          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <div className="flex items-center gap-3 mt-2">
            <p className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </p>
            {!notification.isRead && (
              <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
