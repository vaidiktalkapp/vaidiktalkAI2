// lib/socket.ts (UPDATED - Better Error Handling)
import { io, Socket } from 'socket.io-client';

let adminSocket: Socket | null = null;

export const connectAdminSocket = (token: string) => {
  if (adminSocket?.connected) {
    console.log('✅ Admin socket already connected');
    return adminSocket;
  }

  if (!token) {
    console.error('❌ No token provided for Socket.io connection');
    return null;
  }

  console.log('🔌 Connecting to admin notifications socket...', {
    hasToken: !!token,
    tokenLength: token?.length,
  });

  // Connect to admin namespace
  adminSocket = io(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/admin-notifications`, {
    auth: { 
      token: token, // ✅ Send token properly
    },
    transports: ['websocket', 'polling'], // ✅ Fallback to polling
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10, // ✅ More attempts
    reconnectionDelayMax: 5000,
  });

  // Connection events
  adminSocket.on('connect', () => {
    console.log('✅ Admin socket connected:', adminSocket?.id);
  });

  adminSocket.on('disconnect', (reason) => {
    console.log('❌ Admin socket disconnected:', reason);
  });

  adminSocket.on('connect_error', (error) => {
    console.error('❌ Connection error:', {
      message: error.message,
      data: (error as any).data,
    });
  });

  adminSocket.on('connection-success', (data) => {
    console.log('🎉 Admin notification system ready:', data);
  });

  adminSocket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return adminSocket;
};

export const disconnectAdminSocket = () => {
  if (adminSocket) {
    adminSocket.disconnect();
    adminSocket = null;
    console.log('👋 Admin socket disconnected');
  }
};

export const getAdminSocket = () => adminSocket;

export const subscribeToEvent = (eventType: string) => {
  if (adminSocket?.connected) {
    adminSocket.emit('subscribe-to-event', eventType);
  }
};

export const unsubscribeFromEvent = (eventType: string) => {
  if (adminSocket?.connected) {
    adminSocket.emit('unsubscribe-from-event', eventType);
  }
};
