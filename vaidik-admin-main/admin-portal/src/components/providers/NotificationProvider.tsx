// components/providers/NotificationProvider.tsx (UPDATED - Better Error Handling)
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { connectAdminSocket, disconnectAdminSocket, getAdminSocket } from '@/lib/socket';

interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  playSound: (type: 'notification' | 'urgent' | 'alert') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export default function NotificationProvider({ children }: Props) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const playSound = useCallback((type: 'notification' | 'urgent' | 'alert') => {
    const soundMap = {
      notification: '/sounds/notification.mp3',
      urgent: '/sounds/urgent.mp3',
      alert: '/sounds/alert.mp3',
    };

    try {
      const audio = new Audio(soundMap[type]);
      audio.volume = 0.5;
      audio.play().catch((err) => console.error('Sound play failed:', err));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  useEffect(() => {
    // Get admin token
    const token = localStorage.getItem('admin_token');
    
    if (!token) {
      console.warn('⚠️ No admin token found - Cannot connect to notifications');
      setIsConnected(false);
      return;
    }

    console.log('📥 Found admin token, attempting Socket.io connection...');

    // Connect to Socket.io
    const socket = connectAdminSocket(token);

    if (!socket) {
      console.error('❌ Failed to create Socket.io connection');
      setIsConnected(false);
      return;
    }

    // Track connection status
    const handleConnect = () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
      setConnectionAttempts(0);
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    };

    const handleConnectError = (error: any) => {
      console.error('❌ Connection error:', error);
      setIsConnected(false);
      setConnectionAttempts(prev => prev + 1);

      // If token is invalid, clear it
      if (error?.message?.includes('invalid') || error?.message?.includes('unauthorized')) {
        console.warn('⚠️ Token seems invalid, clearing...');
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Listen for notifications
    socket.on('new-notification', (notification: any) => {
      console.log('📩 New notification:', notification);
      setNotifications((prev) => [notification, ...prev].slice(0, 100));
      setUnreadCount((prev) => prev + 1);
      playSound('notification');
    });

    // Listen for system alerts
    socket.on('system-alert', (alert: any) => {
      console.warn('🚨 SYSTEM ALERT:', alert);
      toast.error(`🚨 ${alert.message}`, {
        duration: 15000,
        position: 'top-center',
      });
      playSound('alert');
    });

    // Listen for realtime events
    socket.on('realtime-event', (event: any) => {
      console.log('📡 Realtime event:', event);
    });

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      disconnectAdminSocket();
    };
  }, [playSound]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        markAsRead,
        markAllAsRead,
        clearAll,
        playSound,
      }}
    >
      {children}
      <Toaster position="top-right" />
    </NotificationContext.Provider>
  );
}
