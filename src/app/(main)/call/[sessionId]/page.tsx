'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../context/AuthContext';
import callService from '../../../../lib/callService';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

export default function CallScreen() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, openLoginModal } = useAuth();

  const sessionId = params.sessionId as string;

  // Call State
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [astrologerName, setAstrologerName] = useState('Astrologer');
  const [callRate, setCallRate] = useState(0);

  // Timer State
  const [remainingTime, setRemainingTime] = useState(0);
  const [maxDuration, setMaxDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [statusText, setStatusText] = useState('Connecting...');

  // Media State
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [remoteUserJoined, setRemoteUserJoined] = useState(false);
  const [isEngineReady, setIsEngineReady] = useState(false);

  // Refs
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const remainingTimeRef = useRef(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const agoraInitializedRef = useRef(false);
  const hasEndedRef = useRef(false);

  // ========== 1. EXTRACT URL PARAMS ==========
  useEffect(() => {
    const type = (searchParams.get('type') as 'audio' | 'video') || 'audio';
    const name = searchParams.get('name') || 'Astrologer';
    const rate = parseFloat(searchParams.get('rate') || '0');

    setCallType(type);
    setAstrologerName(decodeURIComponent(name));
    setCallRate(rate);
    setIsVideoOn(type === 'video');

    console.log('📋 [Call] Params loaded:', { type, name, rate, sessionId });
  }, [searchParams, sessionId]);

  // ========== 2. LOCAL TIMER LOGIC ==========
  const startLocalTimer = (durationSeconds: number) => {
    console.log(`⏱️ [Call] Starting local timer: \${durationSeconds}s`);

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    remainingTimeRef.current = durationSeconds;
    setRemainingTime(durationSeconds);
    setMaxDuration(durationSeconds);
    setIsCallActive(true);
    setStatusText('Call in Progress');

    timerIntervalRef.current = setInterval(() => {
      if (remainingTimeRef.current <= 0) {
        if (!hasEndedRef.current) {
          remainingTimeRef.current = 0;
          setRemainingTime(0);
        }
        return; // Wait for backend call_ended event
      }
      remainingTimeRef.current -= 1;
      setRemainingTime(remainingTimeRef.current);
    }, 1000);
  };

  // ========== 3. AGORA SETUP ==========
  const initAgora = async (payload: any) => {
    if (agoraInitializedRef.current) {
      console.log('⚠️ [Call] Agora already initialized');
      return;
    }

    try {
      console.log('🎥 [Call] Initializing Agora with payload:', payload);
      agoraInitializedRef.current = true;
      setStatusText('Joining call...');

      // Register event handlers before joining
      callService.onUserPublished = async (remoteUser: any, mediaType: 'audio' | 'video') => {
        console.log(`👤 [Call] Remote user published \${mediaType}`, remoteUser);

        if (mediaType === 'audio') {
          await remoteUser.audioTrack?.play();
        }

        if (mediaType === 'video' && remoteVideoRef.current) {
          // Small delay to ensure DOM is ready
          setTimeout(() => {
            if (remoteVideoRef.current) {
              remoteUser.videoTrack?.play(remoteVideoRef.current);
              setRemoteUserJoined(true);
              setStatusText('Connected');
            }
          }, 100);
        }
      };

      callService.onUserUnpublished = (remoteUser: any, mediaType: 'audio' | 'video') => {
        console.log(`👤 [Call] Remote user unpublished \${mediaType}`);
        if (mediaType === 'video') {
          setRemoteUserJoined(false);
        }
      };

      callService.onUserLeft = () => {
        console.log('👤 [Call] Remote user left');
        setRemoteUserJoined(false);
        setStatusText('Astrologer Disconnected');
      };

      // Join Agora channel
      const uid = Number(payload.agoraUid || payload.agoraUserUid);
      await callService.joinChannel(
        payload.agoraToken,
        payload.agoraChannelName || payload.channelName,
        uid,
        callType === 'video',
        payload.agoraAppId
      );

      callService.emit('user_joined_agora', { sessionId, role: 'user' });



      setIsEngineReady(true);
      console.log('✅ [Call] Agora joined successfully');

      // Play local video if video call
      if (callType === 'video' && localVideoRef.current) {
        setTimeout(() => {
          if (localVideoRef.current) {
            callService.playLocalVideo(localVideoRef.current);
          }
        }, 100);
      }

    } catch (error: any) {
      console.error('❌ [Call] Agora initialization failed:', error);
      setStatusText('Media Connection Failed');
      agoraInitializedRef.current = false;
    }
  };

  // ========== 4. MAIN CALL SETUP ==========
  useEffect(() => {
    if (!sessionId || !user?._id) {
      console.log('⚠️ [Call] Missing sessionId or userId');
      return;
    }

    let mounted = true;

    const setupCall = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('⚠️ [Call] No access token');
          openLoginModal?.();
          return;
        }

        // Connect to call socket
        console.log('🔌 [Call] Connecting to socket...');
        await callService.connectSocket(token);

        // Join session room
        console.log(`🚪 [Call] Joining session: \${sessionId}`);
        callService.joinSession(sessionId, user._id, 'user');

        if (mounted) {
          setStatusText('Waiting for Astrologer...');
        }

        // ✅ LISTENER 1: Call Credentials
        callService.on('call_credentials', async (payload: any) => {
          if (payload.sessionId !== sessionId) return;
          console.log('🔑 [Call] Received credentials:', payload);

          await initAgora(payload);

          // Notify backend that user joined Agora
          console.log('📢 [Call] Emitting user_joined_agora');
          callService.emit('user_joined_agora', { sessionId, role: 'user' });
        });

        // ✅ LISTENER 2: Timer Start
        callService.on('timer_start', (payload: any) => {
          if (payload.sessionId !== sessionId) return;
          console.log('⏱️ [Call] Timer start received:', payload);
          startLocalTimer(payload.maxDurationSeconds || 300);
        });

        // ✅ LISTENER 3: Timer Tick (Sync)
        callService.on('timer_tick', (payload: any) => {
          if (payload.sessionId !== sessionId) return;

          // Force sync to the server's truth quietly
          remainingTimeRef.current = payload.remainingSeconds;
          setRemainingTime(payload.remainingSeconds);
        });

        // ✅ LISTENER 4: Call Ended
        const handleCallEnded = (data: any) => {
          if (data?.sessionId === sessionId && !hasEndedRef.current) {
            console.log('🛑 [Call] Call ended by server:', data);
            hasEndedRef.current = true;
            if (mounted) {
              setStatusText('Call Ended');
            }
            cleanupAndExit();
          }
        };

        callService.on('call_ended', handleCallEnded);
        callService.on('end-call', handleCallEnded); // Fallback event name

        // ✅ SYNC: Get current state (for reconnections)
        console.log('🔄 [Call] Requesting timer sync...');
        callService.emit('sync_timer', { sessionId }, (response: any) => {
          if (response?.success && response.data?.remainingSeconds > 0) {
            console.log('✅ [Call] Sync received:', response.data);
            startLocalTimer(response.data.remainingSeconds);
          }
        });

      } catch (error) {
        console.error('❌ [Call] Setup error:', error);
        if (mounted) {
          setStatusText('Connection Failed');
        }
      }
    };

    setupCall();

    // Cleanup
    return () => {
      console.log('🧹 [Call] Component unmounting');
      mounted = false;

      if (!hasEndedRef.current) {
        cleanup();
      }
    };
  }, [sessionId, user?._id]);

  // ========== 5. CLEANUP ==========
  const cleanup = async () => {
    console.log('🧹 [Call] Cleaning up...');

    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Remove socket listeners
    callService.off('call_credentials');
    callService.off('timer_start');
    callService.off('timer_tick');
    callService.off('call_ended');
    callService.off('end-call');

    // Destroy Agora
    try {
      await callService.destroy();
    } catch (err) {
      console.warn('⚠️ [Call] Cleanup error:', err);
    }

    agoraInitializedRef.current = false;
  };

  const cleanupAndExit = async () => {
    await cleanup();

    // Small delay before navigation
    setTimeout(() => {
      router.replace('/orders');
    }, 500);
  };

  // ========== 6. USER ACTIONS ==========
  const handleHangup = async (reason = 'ended_by_user') => {
    if (hasEndedRef.current) {
      console.log('⚠️ [Call] Already ended, skipping');
      return;
    }

    if (!user?._id) return;

    console.log(`📞 [Call] User hangup: \${reason}`);
    hasEndedRef.current = true;
    setStatusText('Ending Call...');

    try {
      callService.emit('end_call', {
        sessionId,
        endedBy: user._id,
        reason
      });
    } catch (error) {
      console.error('❌ [Call] End call error:', error);
    }

    await cleanupAndExit();
  };

  const handleAutoEnd = async () => {
    console.log('⏰ [Call] Auto-ending due to timer expiry');
    await handleHangup('timer_ended');
  };

  const toggleMic = () => {
    const newState = !isMicOn;
    console.log(`🎤 [Call] Toggle mic: \${newState}`);
    setIsMicOn(newState);
    callService.toggleMic(newState);
  };

  const toggleVideo = () => {
    const newState = !isVideoOn;
    console.log(`📹 [Call] Toggle video: \${newState}`);
    setIsVideoOn(newState);
    callService.toggleVideo(newState);
  };

  // ========== 7. HELPERS ==========
  const formatTime = (s: number) => {
    if (s < 0) return '00:00';
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ========== 8. RENDER ==========
  if (callType === 'audio') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        {/* Timer Badge (Top) */}
        {isCallActive && (
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-xl flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full shadow-lg \${remainingTime < 60 ? 'bg-red-500 animate-pulse shadow-red-400/50' : 'bg-green-500 shadow-green-400/50'}`}></div>
            <span className="font-mono text-xl font-semibold tracking-wide text-white">{formatTime(remainingTime)}</span>
          </div>
        )}

        {/* Avatar with Pulse */}
        <div className="relative mb-10 z-10">
          <div className="absolute inset-0 bg-yellow-400 rounded-full opacity-30 animate-ping"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full opacity-20 animate-pulse"></div>
          <div className="w-36 h-36 bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-600 rounded-full flex items-center justify-center text-5xl font-bold relative z-10 shadow-2xl shadow-yellow-500/30 ring-4 ring-blue-400/30">
            {astrologerName.charAt(0).toUpperCase()}
          </div>
        </div>

        <h2 className="text-4xl font-bold mb-3 z-10 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
          {astrologerName}
        </h2>

        <div className="flex items-center gap-2 mb-10 z-10">
          <div className={`w-2 h-2 rounded-full shadow-lg \${isCallActive ? 'bg-green-500 shadow-green-400/50' : 'bg-yellow-400 animate-pulse shadow-yellow-400/50'}`}></div>
          <p className="text-blue-200 text-lg">{statusText}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md px-8 py-3 rounded-full text-base mb-16 z-10 border border-white/20 shadow-xl">
          <span className="text-blue-100">Rate: </span>
          <span className="text-yellow-400 font-bold">{callRate} Cr/min</span>
        </div>

        {/* Controls */}
        <div className="flex gap-6 z-10">
          <button
            onClick={toggleMic}
            className={`group relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg \${
              isMicOn 
                ? 'bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border-2 border-white/30 hover:border-yellow-400/50' 
                : 'bg-red-500 hover:bg-red-600 text-white border-2 border-red-400 shadow-red-500/50'
            }`}
          >
            {isMicOn ? <Mic className="w-6 h-6" strokeWidth={2.5} /> : <MicOff className="w-6 h-6" strokeWidth={2.5} />}
          </button>

          <button
            onClick={() => handleHangup('ended_by_user')}
            disabled={hasEndedRef.current}
            className="group relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-2xl shadow-red-600/50 transform hover:scale-110 active:scale-95 transition-all duration-300 hover:from-red-600 hover:to-red-800 ring-4 ring-red-500/30 hover:ring-red-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PhoneOff className="w-8 h-8" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // ========== VIDEO CALL RENDER ==========
  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 to-blue-950 overflow-hidden">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-950 to-slate-900">
        <div ref={remoteVideoRef} className="w-full h-full" style={{ backgroundColor: '#1e293b' }} />

        {!remoteUserJoined && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-blue-900/30 backdrop-blur-md px-10 py-8 rounded-2xl border border-blue-400/30 shadow-2xl">
              <div className="w-20 h-20 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-blue-100 text-lg">{statusText}</p>
            </div>
          </div>
        )}
      </div>

      {/* Local Video (Small, Top Right) */}
      {isEngineReady && (
        <div className="absolute top-6 right-6 w-36 h-52 bg-gradient-to-br from-blue-900 to-slate-800 rounded-2xl overflow-hidden border-2 border-yellow-400/50 shadow-2xl shadow-blue-900/50 z-20 ring-2 ring-blue-400/20">
          <div ref={localVideoRef} className="w-full h-full object-cover" style={{ backgroundColor: '#1e293b' }}></div>
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-900/90 backdrop-blur-sm">
              <VideoOff className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
          )}
        </div>
      )}

      {/* Top Overlay (Timer + Info) */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-black/60 via-black/30 to-transparent backdrop-blur-sm">
        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 shadow-xl">
            <div className={`w-2.5 h-2.5 rounded-full \${remainingTime < 60 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
            <span className="font-mono text-2xl font-semibold tracking-wide text-yellow-300">{formatTime(remainingTime)}</span>
          </div>
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-blue-950 px-6 py-2.5 rounded-full text-base font-bold shadow-lg shadow-yellow-500/30">
            {callRate} Cr/min
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center gap-6">
        <button
          onClick={toggleMic}
          className={`group w-16 h-16 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 \${
            isMicOn ? 'bg-white/20 border-2 border-white/30' : 'bg-red-500'
          }`}
        >
          {isMicOn ? <Mic className="w-6 h-6 text-white" strokeWidth={2.5} /> : <MicOff className="w-6 h-6 text-white" strokeWidth={2.5} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`group w-16 h-16 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md transition-all transform hover:scale-110 active:scale-95 \${
            isVideoOn ? 'bg-white/20 border-2 border-white/30' : 'bg-blue-600'
          }`}
        >
          {isVideoOn ? <Video className="w-6 h-6 text-white" strokeWidth={2.5} /> : <VideoOff className="w-6 h-6 text-white" strokeWidth={2.5} />}
        </button>

        <button
          onClick={() => handleHangup('ended_by_user')}
          disabled={hasEndedRef.current}
          className="group w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PhoneOff className="w-8 h-8 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}