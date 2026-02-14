'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import AgoraRTC, { 
  IAgoraRTCClient, 
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack 
} from 'agora-rtc-sdk-ng';
import {
  ArrowLeft,
  Users,
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  AlertTriangle,
  Ban,
  MessageCircle,
  Eye,
  Signal
} from 'lucide-react';
import { toast } from 'sonner';

export default function WatchLivestreamPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.streamId as string;

  const [streamData, setStreamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('good');

  // Agora
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    fetchStreamData();
    initializeAgoraViewer();

    return () => {
      cleanup();
    };
  }, [streamId]);

  const fetchStreamData = async () => {
    try {
      const response = await adminApi.getStreamDetails(streamId);
      if (response.data.success) {
        setStreamData(response.data.data);
        setViewers(response.data.data.viewers || []);
        setMessages(response.data.data.recentMessages || []);
      }
    } catch (error) {
      console.error('Fetch stream error:', error);
      toast.error('Failed to load stream');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeAgoraViewer = async () => {
    try {
      // Get Agora token for admin viewer
      const tokenResponse = await adminApi.getViewerToken(streamId);
      const { appId, channelName, token, uid } = tokenResponse.data.data;

      // Create Agora client
      const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
      clientRef.current = client;

      // Set client role to audience (viewer)
      await client.setClientRole('audience');

      // Event listeners
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          const remoteVideoTrack = user.videoTrack;
          if (remoteVideoTrack && videoContainerRef.current) {
            remoteVideoTrack.play(videoContainerRef.current);
          }
        }

        if (mediaType === 'audio') {
          const remoteAudioTrack = user.audioTrack;
          if (remoteAudioTrack) {
            remoteAudioTrack.play();
          }
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video' && user.videoTrack) {
          user.videoTrack.stop();
        }
      });

      client.on('connection-state-change', (curState, prevState, reason) => {
        console.log('Connection state:', curState, reason);
        if (curState === 'DISCONNECTED') {
          toast.error('Disconnected from stream');
        }
      });

      client.on('network-quality', (stats) => {
        if (stats.downlinkNetworkQuality <= 2) {
          setConnectionQuality('excellent');
        } else if (stats.downlinkNetworkQuality <= 4) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
        }
      });

      // Join channel
      await client.join(appId, channelName, token, uid);
      setIsJoined(true);
      console.log('✅ Joined stream as viewer');
    } catch (error) {
      console.error('Agora initialization error:', error);
      toast.error('Failed to connect to stream');
    }
  };

  const cleanup = async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  };

  const toggleMute = () => {
    if (clientRef.current) {
      const remoteUsers = clientRef.current.remoteUsers;
      remoteUsers.forEach(user => {
        if (user.audioTrack) {
          if (isMuted) {
            user.audioTrack.play();
          } else {
            user.audioTrack.stop();
          }
        }
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleForceEndStream = async () => {
    if (!confirm('Are you sure you want to force end this stream?')) return;

    try {
      await adminApi.forceEndStream(streamId, 'Admin action');
      toast.success('Stream ended successfully');
      router.push('/livestreams');
    } catch (error) {
      console.error('Force end error:', error);
      toast.error('Failed to end stream');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const stream = streamData?.stream;

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header Bar */}
      <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="hover:bg-gray-800 p-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div>
            <h1 className="text-lg font-semibold">{stream?.title}</h1>
            <p className="text-sm text-gray-400">Hosted by {stream?.hostId?.name}</p>
          </div>

          {/* Live Indicator */}
          <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <span className="text-sm font-semibold">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Eye size={16} />
              <span>{stream?.viewerCount || 0} viewers</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{calculateDuration(stream?.startedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Signal size={16} className={
                connectionQuality === 'excellent' ? 'text-green-500' :
                connectionQuality === 'good' ? 'text-yellow-500' :
                'text-red-500'
              } />
              <span className="capitalize">{connectionQuality}</span>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleForceEndStream}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <Ban size={16} />
            <span>Force End</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Container */}
        <div className="flex-1 relative bg-black">
          <div 
            ref={videoContainerRef}
            className="w-full h-full flex items-center justify-center"
          >
            {!isJoined && (
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting to stream...</p>
              </div>
            )}
          </div>

          {/* Video Controls Overlay */}
          {isJoined && (
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="bg-gray-900/80 hover:bg-gray-800 text-white p-3 rounded-full transition-colors"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
              </div>

              <button
                onClick={toggleFullscreen}
                className="bg-gray-900/80 hover:bg-gray-800 text-white p-3 rounded-full transition-colors"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar - Viewers & Chat */}
        <div className="w-80 bg-gray-900 text-white flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button className="flex-1 px-4 py-3 bg-gray-800 font-medium">
              <Users size={16} className="inline mr-2" />
              Viewers ({viewers.length})
            </button>
            <button className="flex-1 px-4 py-3 hover:bg-gray-800 transition-colors">
              <MessageCircle size={16} className="inline mr-2" />
              Chat
            </button>
          </div>

          {/* Viewers List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {viewers.map((viewer: any) => (
              <div
                key={viewer._id}
                className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  {viewer.userName?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{viewer.userName}</p>
                  <p className="text-xs text-gray-400">
                    Joined {new Date(viewer.joinedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {viewers.length === 0 && (
              <p className="text-center text-gray-500 py-8">No viewers yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function
function calculateDuration(startedAt: string) {
  if (!startedAt) return '0:00';
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const diff = Math.floor((now - start) / 1000);
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
