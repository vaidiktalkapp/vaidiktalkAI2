'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import chatService from '../lib/chatService';
import callService from '../lib/callService';
import orderService from '../lib/orderService';
import notificationService from '../lib/notificationService';
import { onForegroundMessage } from '../lib/firebase';
import toast from 'react-hot-toast';
import { isProfileComplete } from '../utils/profileValidation';

// ========== INTERFACES ==========
interface Astrologer {
  _id: string;
  id?: string;
  name: string;
  profileImage?: string;
  profilePicture?: string;
  image?: string;
  pricing?: {
    chat?: number;
    call?: number;
    video?: number;
  };
  price?: number;
  chatRate?: number;
  callRate?: number;
  callPrice?: number;
  currentRate?: number;
}

interface ChatSession {
  sessionId: string;
  orderId: string;
  status: string;
  ratePerMinute: number;
  expectedWaitTime?: number;
  queuePosition?: number;
  astrologer: {
    id: string;
    _id: string;
    name: string;
    image?: string;
    price: number;
  };
}

interface CallSession {
  sessionId: string;
  orderId: string;
  status: string;
  callType: 'audio' | 'video';
  ratePerMinute: number;
  expectedWaitTime?: number;
  queuePosition?: number;
  astrologer: {
    id: string;
    _id: string;
    name: string;
    image?: string;
    callPrice: number;
  };
}

interface IncomingCall {
  sessionId: string;
  orderId: string;
  callType: 'audio' | 'video';
  ratePerMinute: number;
  caller: {
    id: string;
    name: string;
  };
}

interface RealTimeContextType {
  ready: boolean;
  pendingChatSession: ChatSession | null;
  chatWaitingVisible: boolean;
  isChatProcessing: boolean;
  initiateChat: (astrologer: Astrologer) => Promise<{ success: boolean; message?: string; data?: any }>;
  cancelChat: () => void;
  pendingCallSession: CallSession | null;
  callWaitingVisible: boolean;
  isCallProcessing: boolean;
  initiateCall: (astrologer: Astrologer, callType?: 'audio' | 'video') => Promise<{ success: boolean; message?: string; data?: any }>;
  cancelCall: () => void;
  incomingCall: IncomingCall | null;
  incomingCallVisible: boolean;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  addNotificationListener: (callback: (payload: any) => void) => () => void;
}

const RealTimeContext = createContext<RealTimeContextType | null>(null);

// ========== PROVIDER ==========
export const RealTimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [socketInitialized, setSocketInitialized] = useState(false);

  // Chat State
  const [pendingChatSession, setPendingChatSession] = useState<ChatSession | null>(null);
  const [chatWaitingVisible, setChatWaitingVisible] = useState(false);
  const [isChatProcessing, setIsChatProcessing] = useState(false);

  // Call State
  const [pendingCallSession, setPendingCallSession] = useState<CallSession | null>(null);
  const [callWaitingVisible, setCallWaitingVisible] = useState(false);
  const [isCallProcessing, setIsCallProcessing] = useState(false);

  // Incoming Call State
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [incomingCallVisible, setIncomingCallVisible] = useState(false);

  // Refs for access in event handlers
  const pendingChatRef = useRef<ChatSession | null>(null);
  const pendingCallRef = useRef<CallSession | null>(null);
  const processedSessionIds = useRef<Set<string>>(new Set());
  
  const notificationListeners = useRef<Set<(payload: any) => void>>(new Set());

  useEffect(() => { pendingChatRef.current = pendingChatSession; }, [pendingChatSession]);
  useEffect(() => { pendingCallRef.current = pendingCallSession; }, [pendingCallSession]);

  // ========== DEBUG LOGGER ==========
  const debugLog = useCallback((source: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    // console.log(`[${timestamp}] 🔍 [${source}] ${message}`, data || '');
  }, []);

  // ========== 0. NOTIFICATION LISTENER SYSTEM ==========
  
  // Internal helper to broadcast to all subscribers
  const broadcastNotification = useCallback((payload: any) => {
    // 1. Explicit Log for Debugging
    console.log("🔥 [FCM-BROADCAST] Notification Payload:", JSON.stringify(payload, null, 2));
    
    notificationListeners.current.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }, []);

  const addNotificationListener = useCallback((callback: (payload: any) => void) => {
    notificationListeners.current.add(callback);
    return () => {
      notificationListeners.current.delete(callback);
    };
  }, []);

  // ========== 1. STATE PERSISTENCE ==========
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChat = sessionStorage.getItem('pendingChatSession');
      const savedCall = sessionStorage.getItem('pendingCallSession');

      if (savedChat) {
        try {
          setPendingChatSession(JSON.parse(savedChat));
          setChatWaitingVisible(true);
        } catch (e) {}
      }

      if (savedCall) {
        try {
          setPendingCallSession(JSON.parse(savedCall));
          setCallWaitingVisible(true);
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (pendingChatSession) {
      sessionStorage.setItem('pendingChatSession', JSON.stringify(pendingChatSession));
    } else {
      sessionStorage.removeItem('pendingChatSession');
    }
  }, [pendingChatSession]);

  useEffect(() => {
    if (pendingCallSession) {
      sessionStorage.setItem('pendingCallSession', JSON.stringify(pendingCallSession));
    } else {
      sessionStorage.removeItem('pendingCallSession');
    }
  }, [pendingCallSession]);

  // ========== 2. CENTRALIZED ACCEPTANCE HANDLER ==========
  const processAcceptance = useCallback((payload: any, eventName?: string, source?: string) => {
    console.log(`📥 [${source}] Processing Acceptance:`, payload);

    // Normalize Data (Handle both { data: {...} } and direct {...})
    const data = payload.data || payload; 
    
    const type = data.type || payload.type || '';
    const step = data.step || '';
    const mode = data.mode || (type.includes('chat') ? 'chat' : type.includes('call') ? 'call' : '');
    
    // Attempt to find ANY valid ID
    const incomingId = data.sessionId || data.id || data._id || data.orderId;

    if (!incomingId) {
      console.warn(`⚠️ [${source}] No Session ID or Order ID found in payload`, data);
      return;
    }

    if (processedSessionIds.current.has(incomingId)) {
      console.log(`🔄 [${source}] Already processed ID: ${incomingId}`);
      return;
    }

    console.log(`🔎 [${source}] Checking Match | ID: ${incomingId} | Mode: ${mode} | Type: ${type}`);

    // --- CHAT HANDLING ---
    const isChatEvent = mode === 'chat' || type.includes('chat') || eventName === 'chat_accepted';
    
    if (isChatEvent) {
      const currentPending = pendingChatRef.current;
      if (currentPending) {
        // Match against EITHER sessionId OR orderId
        const isMatch = incomingId === currentPending.sessionId || incomingId === currentPending.orderId;
        
        if (isMatch) {
          console.log('✅ [Chat] Match Found! Redirecting...');
          processedSessionIds.current.add(incomingId);
          setChatWaitingVisible(false);
          setPendingChatSession(null);

          if (user?._id) {
             chatService.joinSession(currentPending.sessionId, user._id);
          }
          router.push(`/chat/${currentPending.orderId}`);
          return;
        } else {
           console.log(`❌ [Chat] ID Mismatch. Pending: ${currentPending.sessionId} / ${currentPending.orderId}`);
        }
      }
    }

    // --- CALL HANDLING ---
    const isCallEvent = mode === 'call' || type.includes('call') || eventName === 'call_accepted';

    if (isCallEvent) {
      const currentPending = pendingCallRef.current;
      if (currentPending) {
        const isMatch = incomingId === currentPending.sessionId || incomingId === currentPending.orderId;

        if (isMatch) {
          console.log('✅ [Call] Match Found! Redirecting...');
          processedSessionIds.current.add(incomingId);
          setCallWaitingVisible(false);
          setPendingCallSession(null);

          if (user?._id) {
             callService.joinSession(currentPending.sessionId, user._id, 'user');
          }

          // Build Query
          const queryParams: Record<string, string> = {
            type: data.callType || currentPending.callType || 'audio',
            name: encodeURIComponent(data.astrologerName || currentPending.astrologer.name || 'Astrologer'),
            rate: (data.ratePerMinute || currentPending.ratePerMinute || 0).toString(),
          };
          if (data.agoraToken) queryParams.token = data.agoraToken;
          if (data.agoraChannelName) queryParams.channel = data.agoraChannelName;
          if (data.agoraUid) queryParams.uid = data.agoraUid.toString();

          const query = new URLSearchParams(queryParams).toString();
          router.push(`/call/${currentPending.sessionId}?${query}`);
          return;
        } else {
           console.log(`❌ [Call] ID Mismatch. Pending: ${currentPending.sessionId}`);
        }
      }
    }
  }, [router, user]);


  // ========== 3. REGISTER FIREBASE SERVICE WORKER ==========
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((reg) => console.log('✅ [SW] Service Worker Registered'))
        .catch((err) => console.error('❌ [SW] Registration Failed', err));
    }
  }, []);

  // ========== 4. FCM FOREGROUND LISTENER ==========
  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('📡 [FCM] Initializing Foreground Listener...');
    
    // Wrap in try-catch to prevent crashes if firebase isn't configured
    try {
        const unsubscribe = onForegroundMessage((payload) => {
          console.log('📨 [FCM] Message Received:', payload);
          broadcastNotification(payload);
          processAcceptance(payload, undefined, 'FCM-Foreground');
          
          // Handle Call Ended
          const data = payload.data || {};
          if (data.type === 'call_ended' && data.mode === 'call') {
             const currentPending = pendingCallRef.current;
             if (currentPending && data.sessionId === currentPending.sessionId) {
                setCallWaitingVisible(false);
                setPendingCallSession(null);
                if (window.location.pathname.startsWith('/call/')) {
                    router.push('/orders');
                }
             }
          }
        });
        
        return () => {
          console.log('🧹 [FCM] Cleaning up Foreground Listener');
        };
    } catch (error) {
        console.error("❌ [FCM] Failed to init foreground listener:", error);
    }
  }, [isAuthenticated, processAcceptance, router, broadcastNotification]);

  // ========== 5. SETUP SOCKETS ==========
  useEffect(() => {
    let setupAttempted = false;

    const setupSockets = async () => {
      if (setupAttempted) return;
      setupAttempted = true;

      const userId = user?._id;
      if (!isAuthenticated || !userId) return;

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        // --- A. Notification Socket ---
        await notificationService.connect(token);
        
        notificationService.on('notification', (notification: any) => {
          console.log('🔔 [Socket-Notif] Event Received:', notification);
          broadcastNotification(notification);
          processAcceptance(notification, undefined, 'NotificationSocket');
        });

        // --- B. Chat Socket ---
        await chatService.connect(token, userId);
        chatService.on('chat_accepted', (payload: any) => {
          console.log('💬 [Socket-Chat] Chat Accepted:', payload);
          processAcceptance(payload, 'chat_accepted', 'ChatSocket');
        });

        chatService.on('chat_rejected', (payload: any) => {
          setChatWaitingVisible(false);
          setPendingChatSession(null);
          toast.error(payload.message || 'Astrologer rejected your chat request.');
        });

        // --- C. Call Socket ---
        await callService.connectSocket(token);
        callService.on('call_accepted', (payload: any) => {
          console.log('📞 [Socket-Call] Call Accepted:', payload);
          processAcceptance(payload, 'call_accepted', 'CallSocket');
        });

        callService.on('call_rejected', (payload: any) => {
          setCallWaitingVisible(false);
          setPendingCallSession(null);
          toast.error(payload.message || 'Astrologer rejected your call request.');
        });

        callService.on('call_cancelled', () => {
          setCallWaitingVisible(false);
          setPendingCallSession(null);
        });

        callService.on('call_timeout', () => {
          setCallWaitingVisible(false);
          setPendingCallSession(null);
          toast.error('Astrologer did not respond.');
        });

        callService.on('incoming_call', (payload: any) => {
          console.log('📲 [Socket] Incoming Call:', payload);
          setIncomingCall({
            sessionId: payload.sessionId,
            orderId: payload.orderId,
            callType: payload.callType,
            ratePerMinute: payload.ratePerMinute,
            caller: { id: payload.userId, name: payload.userName || 'User' },
          });
          setIncomingCallVisible(true);
        });

        setSocketInitialized(true);
      } catch (error: any) {
        console.error('❌ [Socket] Setup Failed:', error);
        setSocketInitialized(false);
      }
    };

    setupSockets();

    return () => {
      // Cleanup logic if needed
    };
  }, [isAuthenticated, user, processAcceptance, broadcastNotification]);

  // ========== 6. INITIATE CHAT ==========
  const initiateChat = useCallback(async (astrologer: Astrologer) => {
    if (isChatProcessing) return { success: false, message: 'Already processing' };

    if (!isProfileComplete(user)) {
      toast.error("Please complete your profile first");
      router.push('/profile');
      return { success: false, message: 'Profile incomplete' };
    }

    try {
      setIsChatProcessing(true);
      const chatRate = astrologer.pricing?.chat ?? astrologer.chatRate ?? 10;

      const balanceCheck = await orderService.checkBalance(chatRate, 5);
      if (!balanceCheck.success) {
        router.push('/wallet/recharge');
        return { success: false, message: 'Insufficient balance' };
      }

      const chatResponse = await chatService.initiateChat({
        astrologerId: astrologer._id || astrologer.id!,
        astrologerName: astrologer.name,
        ratePerMinute: chatRate,
      });

      if (chatResponse.success && chatResponse.data?.sessionId) {
        const data = chatResponse.data;
        console.log('📞 [Chat] Initiated:', astrologer);
        const newChatSession: ChatSession = {
          sessionId: data.sessionId,
          orderId: data.orderId,
          status: data.status,
          ratePerMinute: chatRate,
          expectedWaitTime: data.expectedWaitTime,
          queuePosition: data.queuePosition,
          astrologer: {
            id: astrologer.id || astrologer._id,
            _id: astrologer._id || astrologer.id!,
            name: astrologer.name,
            image: astrologer.image || astrologer.profileImage || astrologer.profilePicture,
            price: chatRate,
          },
        };

        setPendingChatSession(newChatSession);
        setChatWaitingVisible(true);

        if (user?._id) {
          const token = localStorage.getItem('accessToken');
          if (token) {
            await chatService.connect(token, user._id);
            chatService.joinSession(data.sessionId, user._id);
          }
        }

        return { success: true, data };
      } else {
        const errorMsg = chatResponse.message || 'Unable to start chat session';
        toast.error(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate chat');
      return { success: false, message: error.message };
    } finally {
      setIsChatProcessing(false);
    }
  }, [isChatProcessing, router, user]);

  // ========== 7. INITIATE CALL ==========
  const initiateCall = useCallback(async (astrologer: Astrologer, callType: 'audio' | 'video' = 'audio') => {
    if (isCallProcessing) return { success: false, message: 'Already processing' };

    if (!isProfileComplete(user)) {
      toast.error("Please complete your profile first");
      router.push('/profile');
      return { success: false, message: 'Profile incomplete' };
    }

    try {
      setIsCallProcessing(true);
      const callRate = astrologer.pricing?.call ?? astrologer.callRate ?? 15;

      const balanceCheck = await orderService.checkBalance(callRate, 5);
      if (!balanceCheck.success) {
        router.push('/wallet/recharge');
        return { success: false, message: 'Insufficient balance' };
      }

      const callResponse = await callService.initiateCall({
        astrologerId: astrologer._id || astrologer.id!,
        astrologerName: astrologer.name,
        callType,
        ratePerMinute: callRate,
      });

      if (callResponse.success && callResponse.data?.sessionId) {
        const data = callResponse.data;

        const newCallSession: CallSession = {
          sessionId: data.sessionId,
          orderId: data.orderId,
          status: data.status,
          callType,
          ratePerMinute: callRate,
          expectedWaitTime: data.expectedWaitTime,
          queuePosition: data.queuePosition,
          astrologer: {
            id: astrologer.id || astrologer._id,
            _id: astrologer._id || astrologer.id!,
            name: astrologer.name,
            image: astrologer.image || astrologer.profileImage || astrologer.profilePicture,
            callPrice: callRate,
          },
        };

        setPendingCallSession(newCallSession);
        setCallWaitingVisible(true);

        if (user?._id) {
          const token = localStorage.getItem('accessToken');
          if (token) {
            await callService.connectSocket(token);
            callService.joinSession(data.sessionId, user._id, 'user');
          }
        }

        return { success: true, data };
      } else {
        const errorMsg = callResponse.message || 'Unable to start call session';
        toast.error(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate call');
      return { success: false, message: error.message };
    } finally {
      setIsCallProcessing(false);
    }
  }, [isCallProcessing, router, user]);

  // ========== 8. CANCEL ACTIONS ==========
  const cancelChat = useCallback(() => {
    setChatWaitingVisible(false);
    setPendingChatSession(null);
    processedSessionIds.current.clear();
  }, []);

  const cancelCall = useCallback(async () => {
    if (pendingCallRef.current) {
      try {
        await callService.cancelCall(pendingCallRef.current.sessionId, 'user_cancelled');
      } catch (e) {
        console.error('Failed to send cancel to backend', e);
      }
    }
    setCallWaitingVisible(false);
    setPendingCallSession(null);
    processedSessionIds.current.clear();
  }, []);

  // ========== 9. INCOMING CALL ACTIONS ==========
  const acceptIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    setIncomingCallVisible(false);
    router.push(`/call/${incomingCall.sessionId}?type=${incomingCall.callType}&isIncoming=true`);
    setIncomingCall(null);
  }, [incomingCall, router]);

  const rejectIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    const userId = user?._id || '';
    callService.endCall(incomingCall.sessionId, userId, 'rejected_by_user');
    setIncomingCallVisible(false);
    setIncomingCall(null);
  }, [incomingCall, user]);

  // ========== CONTEXT VALUE ==========
  const value: RealTimeContextType = {
    ready: socketInitialized,
    pendingChatSession,
    chatWaitingVisible,
    isChatProcessing,
    initiateChat,
    cancelChat,
    pendingCallSession,
    callWaitingVisible,
    isCallProcessing,
    initiateCall,
    cancelCall,
    incomingCall,
    incomingCallVisible,
    acceptIncomingCall,
    rejectIncomingCall,
    addNotificationListener,
  };

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  );
};

export const useRealTime = () => {
  const ctx = useContext(RealTimeContext);
  if (!ctx) throw new Error('useRealTime must be used within RealTimeProvider');
  return ctx;
};