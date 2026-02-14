// lib/types.ts
export interface Notification {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recipientModel?: string;
  recipientId?: string;
  timestamp: Date;
  isRead?: boolean;
}

export interface RealtimeEvent {
  eventType: string;
  data: any;
  timestamp: Date;
}

export interface DashboardStats {
  newOrders?: number;
  activeCalls?: number;
  liveStreams?: number;
  connectedUsers?: number;
}

export interface BroadcastPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  imageUrl?: string;
  actionUrl?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SchedulePayload extends BroadcastPayload {
  scheduledFor: string;
  recipientType: 'all_users' | 'all_astrologers' | 'specific_users' | 'followers';
  specificRecipients?: string[];
  astrologerId?: string;
}

export interface ScheduledNotification {
  scheduleId: string;
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  type: string;
  title: string;
  message: string;
  recipientType: string;
  createdAt: Date;
}
