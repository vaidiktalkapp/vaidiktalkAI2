'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import aiSocketService from '@/lib/aiSocketService';
import aiAstrologerService, { AiChatMessage, AiAstrologer } from '@/lib/aiAstrologerService';
import { Send, Clock, Wallet, LogOut, MessageCircle, Sparkles, User, Info, Languages, Star, Shield, Zap, Moon, Sun, Heart, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const MANTRA_ROTATION_SPEED_MS = 4000;

const ChatPage = () => {
  const params = useParams();
  const orderId = params.orderId as string;
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [astrologer, setAstrologer] = useState<AiAstrologer | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [timer, setTimer] = useState({ duration: 0, currentCost: 0, walletBalance: user?.wallet?.balance || 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`ai-chat-intake-${orderId}`);
      if (stored) {
        try {
          const data = JSON.parse(stored);
          return data.language || 'English';
        } catch (e) {
          return 'English';
        }
      }
    }
    return 'English';
  });
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentIntake = useRef(false);
  const hasEmittedIntake = useRef(false);
  const isInitialLoad = useRef(true);
  const listenersAttached = useRef(false);
  const socketConnected = useRef(false);
  const activeSessionRef = useRef<string | null>(null); // ✅ Added for robust session tracking

  // Use astrologer's languages if available, otherwise default set
  const languages = astrologer?.languages && astrologer.languages.length > 0
    ? astrologer.languages
    : ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi'];

  // Spiritual mantras for blessings
  const spiritualBlessings = [
    "ॐ शांति शांति शांति",
    "सर्वे भवन्तु सुखिनः",
    "ॐ नमः शिवाय",
    "ॐ गं गणपतये नमः",
    "जय श्री राम",
    "हरे कृष्ण हरे राम"
  ];

  const [currentMantra, setCurrentMantra] = useState(spiritualBlessings[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMantra(prev => {
        const currentIndex = spiritualBlessings.indexOf(prev);
        const nextIndex = (currentIndex + 1) % spiritualBlessings.length;
        return spiritualBlessings[nextIndex];
      });
    }, MANTRA_ROTATION_SPEED_MS);

    return () => clearInterval(interval);
  }, []);

  // Initialize and check auth
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    console.log('🔐 [AI Chat] Auth State:', {
      isAuthenticated,
      authLoading,
      orderId,
      hasUser: !!user
    });

    // CRITICAL: Only redirect if auth has DEFINITELY finished loading and user is NOT authenticated
    // Don't redirect during initial auth loading to prevent premature redirects
    if (!authLoading && isAuthenticated === false) {
      console.warn('🔒 [AI Chat] Not authenticated after auth check completed, redirecting to home...');
      toast.error('Please login to access AI chat');
      router.push('/');
      return;
    }

    // Fetch data only when authenticated and auth loading is complete
    if (isAuthenticated && !authLoading && orderId) {
      console.log('✅ [AI Chat] Authenticated, fetching chat data for order:', orderId);

      // ✅ RESET STATE to prevent flickering from previous session
      if (activeSessionRef.current !== orderId) {
        setMessages([]);
        setSession(null);
        setAstrologer(null);
        setTimer({ duration: 0, currentCost: 0, walletBalance: user?.wallet?.balance || 0 });
        hasSentIntake.current = false;
        hasEmittedIntake.current = false;
        isInitialLoad.current = true;
        // Do NOT reset socketConnected here as we might reuse connection, 
        // but fetch data will handle re-joining rooms.
        activeSessionRef.current = orderId;
      }

      fetchData();
    } else if (!authLoading && isAuthenticated && !orderId) {
      console.error('❌ [AI Chat] Missing order ID');
      toast.error('Invalid chat session');
      router.push('/ai-chat-history');
    }
  }, [orderId, isAuthenticated, authLoading]);

  const setupSocketListeners = () => {
    // 1. Listen for new messages
    const handleNewMessage = (rawData: any) => {
      console.log('📩 [AI Chat] Raw Socket Payload:', rawData);

      // Normalize message - carefully handle if data is nested
      const data = (rawData && typeof rawData.message === 'object')
        ? { ...rawData, ...rawData.message }
        : rawData;

      console.log('📩 [AI Chat] Normalized Message:', data);
      setIsTyping(false); // Stop typing indicator if new message arrives

      const currentSessionId = activeSessionRef.current || orderId;
      const msgSessionId = data.sessionId || data.orderId;

      if (!currentSessionId) {
        console.warn('⚠️ [AI Chat] Ignoring message - No session context');
        return;
      }

      // Allow if it matches current sessionId OR the initial orderId
      const isMatch = (msgSessionId === currentSessionId) || (msgSessionId === orderId);

      if (!isMatch) {
        console.warn(`⚠️ [AI Chat] Ignoring message from different session: ${msgSessionId}. Expected: ${currentSessionId} or ${orderId}`);
        return;
      }

      setMessages((prev) => {
        // Prevent duplicates using both id and messageId for robustness
        if (prev.some((m) => (data._id && m._id === data._id) || (data.messageId && m.messageId === data.messageId))) return prev;

        // Remove optimistic message if this is the real one
        // (Assuming optimistic ID matches or content matches)
        const withoutOptimistic = prev.filter(m =>
          !m._id?.toString().startsWith('temp-') ||
          (m.content !== data.content)
        );

        return [...withoutOptimistic, {
          ...data,
          content: data.content || data.message || (typeof data === 'string' ? data : ''),
          senderModel: data.sender || data.senderModel || 'Astrologer', // Normalize sender
          sentAt: data.createdAt || data.sentAt || new Date().toISOString()
        }];
      });

      scrollToBottom();
    };

    if (!listenersAttached.current) {
      console.log('🎧 [AI Chat] setting up socket listeners...');

      aiSocketService.on('ai_message', handleNewMessage);

      aiSocketService.on('ai_typing', (data: { sessionId?: string; orderId?: string }) => {
        // Only show if for this session
        if ((activeSessionRef.current && data.sessionId === activeSessionRef.current) || data.orderId === orderId) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 5000); // Auto-clear after 5s
          scrollToBottom();
        }
      });

      aiSocketService.on('timer_update', (data: { sessionId?: string; orderId?: string; duration: number; currentCost?: number; walletBalance: number }) => {
        // Updated timer logic
        if (data.sessionId === activeSessionRef.current || data.orderId === orderId) {
          setTimer({
            duration: data.duration,
            currentCost: data.currentCost || (data.duration * ((astrologer as any)?.charges || 0) / 60),
            walletBalance: data.walletBalance
          });
        }
      });

      // Handle suggestions
      aiSocketService.on('suggestions', (data: string[]) => {
        console.log('💡 [AI Chat] Received suggestions:', data);
        if (Array.isArray(data)) {
          setSuggestions(data);
        }
      });

      // Handle chat error
      aiSocketService.on('chat_error', (data: { message: string, error?: string }) => {
        console.error('❌ [AI Chat] Chat Error:', data);
        setChatError(data.message);
        toast.error(data.message || 'Celestial connection lost');
        setIsTyping(false);
      });

      // Handle session ended
      aiSocketService.on('session_ended', (data: { sessionId?: string; orderId?: string; reason?: string }) => {
        if (data.sessionId === activeSessionRef.current || data.orderId === orderId) {
          console.log('🛑 [AI Chat] Session Ended:', data.reason);

          const reasonMap: Record<string, string> = {
            'user_ended': 'Completed by User',
            'low_balance': 'Insufficient Balance',
            'timeout': 'Session Timed Out',
            'error': 'System Connection Error',
            'completed': 'Consultation Completed'
          };

          const displayReason = reasonMap[data.reason || ''] || data.reason || 'Completed';
          toast('Session Ended: ' + displayReason);
          router.push('/ai-chat-history');
        }
      });

      listenersAttached.current = true;
    }
  };

  const fetchData = async () => {
    try {
      // Validate order ID before proceeding
      if (!orderId || orderId === 'undefined' || orderId === 'null') {
        console.error('❌ [AI Chat] Invalid Order ID:', orderId);
        toast.error("Invalid chat session. Please start a new consultation.");
        setTimeout(() => router.push('/ai-chat-history'), 1500);
        return;
      }

      console.log('📡 [AI Chat] Fetching conversation data for order:', orderId);
      setLoading(true);

      // Fetch conversation with error handling
      const conversation = await aiAstrologerService.getAiChatConversation(orderId);

      // Validate conversation data
      if (!conversation || !conversation._id) {
        console.error('❌ [AI Chat] Invalid conversation data received:', conversation);
        toast.error("Failed to load chat session. Redirecting to history...");
        setTimeout(() => router.push('/ai-chat-history'), 2000);
        return;
      }

      // Set astrologer with validation
      if (conversation.astrologer) {
        console.log('✅ [AI Chat] Setting astrologer:', conversation.astrologer.name);
        setAstrologer(conversation.astrologer);
        toast.success(`Connected with ${conversation.astrologer.name}`);
      } else {
        console.warn('⚠️ [AI Chat] Astrologer data missing in conversation');
        toast('Loading astrologer details...', { icon: '⏳' });
        // Don't fail completely - the service should populate astrologer in normalization
      }

      // We need session info for the timer
      setSession(conversation);

      // Resilient session ID extraction
      if (conversation.activeSession?.sessionId) {
        activeSessionRef.current = conversation.activeSession.sessionId;
      } else if (conversation.sessionId) {
        activeSessionRef.current = conversation.sessionId;
      } else if (conversation._id && conversation._id !== orderId) {
        activeSessionRef.current = conversation._id;
      }

      // Sync wallet balance if user is loaded
      if (user?.wallet?.balance !== undefined) {
        setTimer(prev => ({ ...prev, walletBalance: user.wallet.balance }));
      }

      // 1. Identify locked content types unique to this chat
      const history = conversation.messages || [];
      const hasIntakeInHistory = history.some(m => m.content?.startsWith("Below are my details:"));

      setMessages(prev => {
        // 2. Filter PREVIOUS messages (optimistic ones)
        const cleanPrev = prev.filter(m => {
          const isTemp = m._id?.toString().startsWith('temp-');

          // A. Remove temp intake if valid one exists in history
          if (isTemp && m.content?.startsWith("Below are my details:") && hasIntakeInHistory) {
            return false;
          }

          // B. Remove temp greeting if real greeting (astrologer msg) exists in history
          const hasRealGreeting = history.some(hm => hm.senderModel === 'AiAstrologer');
          if (isTemp && m._id?.toString().startsWith('temp-greeting') && hasRealGreeting) {
            return false;
          }

          // C. General Content Match
          const isMatch = history.some(hm => hm.content?.trim() === m.content?.trim());
          if (isTemp && isMatch) return false;

          return true;
        });

        const combined = [...cleanPrev, ...history];

        // 3. Final Unique Pass (Dedup by ID)
        const unique = [];
        const seen = new Set();
        let foundIntake = false;

        for (const m of combined) {
          const id = m._id?.toString();

          if (m.content?.startsWith("Below are my details:")) {
            if (foundIntake) continue;
            foundIntake = true;
          }

          if (id && !seen.has(id)) { // Added id check
            seen.add(id);
            unique.push(m);
          }
        }

        return unique.sort((a, b) => {
          const idA = a._id?.toString(); // Added null/undefined check
          const idB = b._id?.toString(); // Added null/undefined check
          if (idA?.startsWith('temp-greeting')) return 1; // Added null/undefined check
          if (idB?.startsWith('temp-greeting')) return -1; // Added null/undefined check
          const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0; // Added null/undefined check
          const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0; // Added null/undefined check
          return timeA - timeB;
        });
      });

      // Connect socket
      const token = localStorage.getItem('accessToken');
      if (token && !socketConnected.current) {
        await aiSocketService.connect(token, user?._id);
        setupSocketListeners();
        socketConnected.current = true;

        if (user?._id) {
          aiSocketService.joinSession(
            conversation.sessionId || orderId,
            user._id,
            orderId
          );

          // ✅ TRIGGER: Send intake details via socket to trigger specialized greeting
          // ✅ TRIGGER: Send intake details via socket to trigger specialized greeting
          // ONLY if no history exists (prevents duplicates on reload)
          const storedIntake = localStorage.getItem(`ai-chat-intake-${orderId}`);

          if (storedIntake && !hasEmittedIntake.current && history.length === 0) {
            hasEmittedIntake.current = true;
            const intakeData = JSON.parse(storedIntake);

            const initialMsg = `Below are my details:
Name: ${intakeData.name || 'User'}
Gender: ${intakeData.gender || 'Unknown'}
Date of Birth: ${intakeData.date}
Time of Birth: ${intakeData.time}
Place of Birth: ${intakeData.place}
Marital Status: ${intakeData.maritalStatus || 'Unknown'}
Occupation: ${intakeData.occupation || 'Unknown'}`;

            // Add optimistic message locally
            const optimisticMsg = {
              _id: 'temp-intake-' + Date.now(),
              senderModel: 'User',
              content: initialMsg,
              sentAt: new Date().toISOString()
            };
            setMessages(prev => [...prev, optimisticMsg]);

            aiSocketService.sendMessage(
              conversation.sessionId || orderId,
              initialMsg,
              user._id,
              orderId
            );
          }

        }
      }
    } catch (error: any) {
      console.error('❌ [AI Chat] Fetch Data Error:', error);

      // Handle specific error types
      if (error.response?.status === 404) {
        console.error('❌ [AI Chat] Chat session not found (404)');
        toast.error("Chat session not found. Redirecting to history...");
        setTimeout(() => router.push('/ai-chat-history'), 2000);
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('❌ [AI Chat] Authentication error:', error.response?.status);
        toast.error("Session expired. Please login again.");
        setTimeout(() => router.push('/'), 2000);
      } else if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        console.error('❌ [AI Chat] Backend connection failed');
        toast.error("Unable to connect to server. Please check your connection and try again.");
      } else {
        console.error('❌ [AI Chat] Unexpected error:', error.message);
        toast.error(error.response?.data?.message || "Failed to load conversation. Please try again.");
        setTimeout(() => router.push('/ai-chat-history'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    // Local timer ticker as fallback
    // If socket is connected, we rely on server updates to prevent fluctuation
    if (loading || !astrologer || socketConnected.current) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        // If we have a start time from the session, use that for accuracy
        let newDuration = prev.duration + 1;

        if (session?.startedAt || (session as any)?.startTime) {
          const start = new Date(session?.startedAt || (session as any)?.startTime).getTime();
          const now = Date.now();
          newDuration = Math.floor((now - start) / 1000);
        }

        const rate = (astrologer as any)?.chatRate || (astrologer as any)?.rate || 0;
        const estimatedCost = Math.ceil((newDuration / 60) * rate);

        return {
          ...prev,
          duration: newDuration,
          currentCost: rate > 0 ? estimatedCost : prev.currentCost
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, astrologer, session, socketConnected.current]);



  useEffect(() => {
    scrollToBottom(isInitialLoad.current);
    if (isInitialLoad.current && messages.length > 0) {
      isInitialLoad.current = false;
    }
  }, [messages, isTyping]);

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: instant ? 'auto' : 'smooth',
      block: 'end'
    });
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || !user?._id || !astrologer) return;

    const msgText = input.trim();
    setInput('');
    setSuggestions([]); // Clear suggestions on new message
    setChatError(null); // Clear previous errors

    // Optimistic Update
    const optimisticMsg = {
      _id: 'temp-manual-' + Date.now(),
      senderModel: 'User',
      content: msgText,
      sentAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const socket = aiSocketService.getSocket();
    if (socket) {
      console.log('📤 [AI Chat] Sending message:', msgText);

      const sessionIdToUse = activeSessionRef.current || orderId;
      aiSocketService.sendMessage(sessionIdToUse, msgText, user._id, orderId);
    }

    setSuggestions([]);
  };

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang);
    const socket = aiSocketService.getSocket();
    if (socket) {
      // Direct emit if service doesn't have helper yet
      socket.emit('change_ai_language', {
        orderId,
        language: lang
      });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    // Optimistic Update
    const optimisticMsg = {
      _id: 'temp-suggestion-' + Date.now(),
      senderModel: 'User',
      content: suggestion,
      sentAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const socket = aiSocketService.getSocket();
    if (socket) {
      console.log('📤 [AI Chat] Sending suggestion:', suggestion);

      const sessionIdToUse = activeSessionRef.current || orderId;
      aiSocketService.sendMessage(sessionIdToUse, suggestion, user?._id || '', orderId);
    }
    setSuggestions([]);
  };

  const handleEndSession = async () => {
    if (window.confirm("Are you sure you want to end this divine consultation?")) {
      try {
        if (activeSessionRef.current && user?._id) {
          aiSocketService.endChat(activeSessionRef.current, user._id);
        }
        await aiAstrologerService.endAiChat(orderId);
        toast.success('Session ended');
        router.push('/ai-chat-history');
      } catch (error) {
        toast.error("Failed to end session");
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getImageUrl = (url?: string, name: string = 'AI') => {
    if (url && url.trim() !== '') return url;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF8C00&color=fff&bold=true`;
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-saffron-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-saffron-50 via-amber-50 to-orange-50 p-0 md:p-4 flex items-center justify-center overflow-hidden z-50 font-outfit">
      {/* Main Chat Box */}
      <div className="relative flex flex-col bg-gradient-to-br from-saffron-50 via-white to-amber-50 w-full md:max-w-4xl rounded-none md:rounded-3xl overflow-hidden shadow-3xl border-0 md:border-2 border-orange-200 h-full md:h-[95vh] z-10 mx-auto">
        {/* Spiritual Background Patterns */}
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDI0MCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEyMCAyMEMxNjYuMiAyMCAyMDQgNTcuOCAyMDQgMTA0QzIwNCAxNTAuMiAxNjYuMiAxODggMTIwIDE4OEM3My44IDE4OCAzNiAxNTAuMiAzNiAxMDRDMzYgNTcuOCA3My44IDIwIDEyMCAyMFoiIGZpbGw9IiNGRjlDMzYiLz48Y2lyY2xlIGN4PSIxMjAiIGN5PSIxMDQiIHI9IjQwIiBmaWxsPSIjRkZGIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI4IiBmaWxsPSIjRkY5QzM2Ij7FtTwvdGV4dD48L3N2Zz4=')] bg-repeat" />

        {/* Chat Header */}
        <header className="relative bg-gradient-to-r from-white to-orange-50 border-b-2 border-orange-200 px-2 py-1.5 md:px-4 md:py-2 flex items-center justify-between shadow-sm z-10 shrink-0 backdrop-blur-sm">
          {/* Left: Astrologer Info */}
          <div className="flex items-center space-x-1.5 md:space-x-3 min-w-0">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 rounded-full blur opacity-30"></div>
              <img
                src={getImageUrl(astrologer?.profileImage, astrologer?.name)}
                className="relative w-7 h-7 md:w-12 md:h-12 rounded-full object-cover border-1.5 md:border-3 border-white shadow-lg"
                alt={astrologer?.name}
              />
              <div className="absolute bottom-0 right-0 w-2 h-2 md:w-4 md:h-4 bg-green-500 border-1.5 border-white rounded-full"></div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 md:gap-2 mb-0 md:mb-1">
                <h2 className="font-bold text-gray-900 text-xs md:text-lg truncate">{astrologer?.name}</h2>
                <Shield className="w-2.5 h-2.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="flex shrink-0">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="w-2 h-2 md:w-3 md:h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-[9px] md:text-xs font-bold text-gray-700">{astrologer?.rating || 4.8}</span>
              </div>
            </div>
          </div>

          {/* Center: Blessing & Language */}
          {/* Center: Blessing & Language */}
          <div className="flex flex-col items-center gap-0.5 md:gap-2 px-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMantra}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="text-[9px] md:text-sm font-black text-orange-800 bg-orange-100/80 px-1.5 md:px-5 py-1 md:py-2.5 rounded-lg md:rounded-2xl border-2 border-orange-200 shadow-sm flex items-center gap-1 md:gap-3 max-w-[100px] md:max-w-none"
              >
                <Moon className="w-3 h-3 md:w-5 md:h-5 text-orange-600 shrink-0" />
                <span className="truncate">{currentMantra}</span>
              </motion.div>
            </AnimatePresence>

            {/* Selected Language Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              key={currentLanguage}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-0.5 md:py-1.5 bg-white shadow-sm rounded-full border border-orange-100"
            >
              <Languages className="w-3 h-3 md:w-5 md:h-5 text-orange-600" />
              <span className="text-[8px] md:text-xs font-black uppercase tracking-widest text-orange-900">
                {currentLanguage}
              </span>
            </motion.div>
          </div>

          {/* Right: Stats & End Button */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Stats Group for Mobile/Desktop */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Timer */}
              <div className="flex flex-col items-center bg-white px-2 md:px-5 py-0.5 md:py-2 rounded-lg md:rounded-2xl border border-orange-100 shadow-sm">
                <div className="flex items-center text-[8px] md:text-xs text-gray-700 font-black uppercase tracking-widest">
                  <Clock className="w-2.5 h-2.5 md:w-4 md:h-4 mr-1 text-orange-600" />
                  <span className="hidden xs:inline">TIME</span>
                </div>
                <div className="text-[11px] md:text-2xl font-black bg-gradient-to-br from-orange-600 to-amber-700 bg-clip-text text-transparent font-mono">
                  {formatDuration(timer.duration)}
                </div>
              </div>

              {/* Balance & Cost */}
              <div className="flex flex-col items-center bg-white px-2 md:px-5 py-0.5 md:py-2 rounded-lg md:rounded-2xl border border-orange-100 shadow-sm">
                <div className="flex items-center text-[8px] md:text-xs text-gray-700 font-black uppercase tracking-widest">
                  <Wallet className="w-2.5 h-2.5 md:w-4 md:h-4 mr-1 text-orange-600" />
                  <span className="hidden xs:inline">BAL</span>
                </div>
                <div className="flex flex-col items-center -space-y-0.5 md:-space-y-1">
                  <div className="text-[11px] md:text-xl font-black text-green-700">
                    ₹{Math.max(0, Math.floor(timer.walletBalance - timer.currentCost))}
                  </div>
                  {timer.currentCost > 0 && (
                    <div className="text-[7px] md:text-[10px] font-black text-white bg-red-600 px-1 md:px-2 rounded-full shadow-sm animate-pulse">
                      -₹{timer.currentCost}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* End Session Button */}
            <button
              onClick={handleEndSession}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-1 md:px-4 md:py-2 rounded-lg transition-all shadow-md active:scale-95 flex items-center gap-1 font-bold text-[10px] md:text-sm shrink-0"
              title="End Session"
            >
              <LogOut className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">End</span>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 space-y-4 bg-gradient-to-b from-orange-50/30 to-amber-50/20 relative custom-scrollbar">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-70">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-amber-200 rounded-full blur-xl opacity-30"></div>
                <div className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg border border-orange-200">
                  <MessageCircle className="w-10 h-10 text-orange-400" />
                </div>
              </div>
              <div className="max-w-md">
                <h3 className="font-bold text-gray-800 text-lg mb-2">Start Your Spiritual Consultation</h3>
                <p className="text-sm text-gray-600">Ask about your career, relationships, health, or spiritual journey.</p>
                <div className="mt-4 text-xs text-orange-600 font-bold bg-orange-50/50 px-4 py-2 rounded-lg border border-orange-200">
                  <Heart className="w-3 h-3 inline mr-1" />
                  Your questions are answered with divine guidance
                </div>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={msg._id || idx}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                className={`flex ${msg.senderModel === 'User' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-4 md:px-5 py-3 md:py-4 rounded-[20px] shadow-md relative overflow-hidden ${msg.senderModel === 'User'
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-tr-none'
                  : msg.senderModel === 'System'
                    ? 'bg-red-50 border-2 border-red-200 text-red-800 rounded-xl shadow-red-100'
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 rounded-tl-none border border-orange-100/50 shadow-orange-100/20'
                  }`}>

                  {msg.senderModel === 'Astrologer' && (
                    <div className="flex items-center gap-2 mb-2.5 text-[10px] md:text-[11px] font-black text-orange-700 uppercase tracking-widest opacity-80">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                      {astrologer?.name}
                    </div>
                  )}

                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap relative z-10 font-['Inter',sans-serif] font-medium tracking-tight">
                    {msg.content}
                  </p>

                  <div className={`flex items-center justify-between mt-3 text-[9px] md:text-[10px] font-bold tracking-wider uppercase opacity-60 ${msg.senderModel === 'User' ? 'text-orange-100' : 'text-orange-800/40'}`}>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.senderModel === 'Astrologer' && (
                      <Sparkles className="w-3 h-3 animate-pulse" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white border border-orange-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-gradient-to-br from-orange-600 to-amber-700 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                  <span className="text-xs text-gray-600 font-bold">Astrologer is typing...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </main>

        {/* Input Area */}
        <footer className="relative bg-gradient-to-r from-white to-orange-50 border-t-2 border-orange-200 p-3 md:px-6 md:py-3 shrink-0">
          <div className="max-w-5xl mx-auto">
            {/* Auto-suggestions */}
            {suggestions.length > 0 && (
              <div className="flex overflow-x-auto no-scrollbar gap-2 mb-2 pb-1">
                {suggestions.map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="whitespace-nowrap bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200 px-3 py-1 rounded-xl text-[10px] md:text-xs font-bold hover:from-orange-200 hover:to-amber-200 transition-all shadow-sm active:scale-95"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="relative">
              <div className="relative flex items-end gap-2">
                <textarea
                  rows={1}
                  placeholder="Type your question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading || isTyping}
                  className="flex-1 px-5 py-3 md:py-4 bg-white border-2 border-orange-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all text-sm md:text-base font-bold shadow-lg placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed resize-none overflow-hidden min-h-[56px] max-h-48"
                  onInput={(e) => {
                    const target = e.currentTarget as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !loading && !isTyping) {
                        handleSendMessage(e as any);
                      }
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading || isTyping}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white p-2.5 md:p-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none shrink-0"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5 " />
                </button>
              </div>

              {/* Footer Info */}
              <div className="mt-2 flex items-center justify-between text-[8px] md:text-[10px] text-gray-500">
                <div className="flex items-center gap-3">
                  <div className="flex items-center font-bold text-green-600">
                    <div className="w-1 h-1 bg-green-500 rounded-full mr-1"></div>
                    Live
                  </div>
                  <div className="flex items-center">
                    <Shield className="w-2.5 h-2.5 mr-1" />
                    Secure
                  </div>
                </div>
                <div className="text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200">
                  ॐ दिव्य मार्गदर्शन
                </div>
              </div>
            </form>
          </div>
        </footer>
      </div>
    </div>
  );
};


export default ChatPage;
