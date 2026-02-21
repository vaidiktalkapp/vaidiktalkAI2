'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { MessageCircle, Timer, AlertCircle, Square, Activity, Eye, X } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { toast } from 'sonner';

interface ChatSession {
  _id: string;
  orderId: string;
  sessionId: string;
  userId: { name: string; phoneNumber?: string; profileImage?: string };
  astrologerId: { name: string; profilePicture?: string };
  type: string;
  status: string;
  duration?: number;
  messageCount?: number;
  createdAt: string;
}

export default function ChatsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [viewingChatSessionId, setViewingChatSessionId] = useState<string | null>(null);

  // 1. Fetch Active Chats
  const { data: activeChats, isLoading: isLoadingActive } = useQuery({
    queryKey: ['active-chats'],
    queryFn: async () => {
      const response = await adminApi.getAllChats({ status: 'active', limit: 50 });
      return response.data.data.orders; 
    },
    refetchInterval: 5000,
  });

  // 2. Fetch Chat History
  const { data: chatHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['chat-history', page],
    queryFn: async () => {
      const response = await adminApi.getAllChats({ page, limit: 20 });
      return response.data.data;
    },
  });

  // ✅ Fixed Mutation to use forceEndChat
  const endChatMutation = useMutation({
    mutationFn: (sessionId: string) => adminApi.forceEndChat(sessionId),
    onSuccess: () => {
      toast.success('Chat ended successfully');
      queryClient.invalidateQueries({ queryKey: ['active-chats'] });
      queryClient.invalidateQueries({ queryKey: ['chat-history'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end chat');
    },
  });

  const columns: Column<ChatSession>[] = [
    { 
      header: 'Session ID', 
      accessorKey: 'sessionId', 
      cell: (row) => <span className="font-mono text-xs">{row.sessionId || row.orderId}</span> 
    },
    { 
      header: 'User', 
      cell: (row) => <span className="font-medium">{row.userId?.name}</span> 
    },
    { 
      header: 'Astrologer', 
      cell: (row) => row.astrologerId?.name 
    },
    { 
      header: 'Messages', 
      cell: (row) => (
        <div className="flex items-center gap-1">
          <MessageCircle size={14} className="text-gray-400" />
          <span>{row.messageCount || 0}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessorKey: 'status',
      cell: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs capitalize ${
          row.status === 'active' ? 'bg-blue-100 text-blue-700 animate-pulse' : 
          row.status === 'ended' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
        }`}>
          {row.status}
        </span>
      )
    },
    { 
      header: 'Date', 
      cell: (row) => new Date(row.createdAt).toLocaleDateString() 
    },
    { 
      header: 'Actions', 
      cell: (row) => (
        <button 
          onClick={() => setViewingChatSessionId(row.sessionId)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        >
          <Eye size={14} /> Read Chat
        </button>
      )
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="text-blue-600" /> Chat Traction
          </h1>
          <p className="text-sm text-gray-500">Live monitoring of chat sessions</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => router.push('/orders')} className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">Orders</button>
          <button onClick={() => router.push('/orders/calls')} className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">Calls</button>
          <button className="px-4 py-1.5 text-sm font-medium bg-white text-gray-900 shadow-sm rounded-md">Chats</button>
        </div>
      </div>

      {/* Live Active Chats */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Live Active Chats ({activeChats?.length || 0})
          </h2>
        </div>

        {isLoadingActive ? (
          <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
        ) : activeChats?.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No chats currently active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeChats?.map((chat: ChatSession) => (
              <ActiveChatCard 
                key={chat._id} 
                chat={chat} 
                onEnd={() => endChatMutation.mutate(chat.sessionId)} 
                isEnding={endChatMutation.isPending && endChatMutation.variables === chat.sessionId}
                // Pass the onView prop
                onView={(id) => setViewingChatSessionId(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Chat History</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <DataTable
            data={chatHistory?.orders || []}
            columns={columns}
            isLoading={isLoadingHistory}
            pagination={{
              page,
              totalPages: chatHistory?.pagination?.pages || 1,
              onPageChange: setPage,
            }}
          />
        </div>
      </section>

      {/* NEW: Render Chat Modal when an ID is selected */}
      {viewingChatSessionId && (
        <ChatViewerModal 
          sessionId={viewingChatSessionId} 
          onClose={() => setViewingChatSessionId(null)} 
        />
      )}
    </div>
  );
}

// Ensure ActiveChatCard receives and uses the onView prop
function ActiveChatCard({ chat, onEnd, isEnding, onView }: { chat: ChatSession; onEnd: () => void; isEnding: boolean; onView: (id: string) => void }) {
  const startTime = new Date(chat.createdAt).getTime();
  const durationMin = Math.floor((Date.now() - startTime) / 60000);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 bg-blue-50 rounded-bl-xl text-blue-700 text-xs font-bold flex items-center gap-1">
        <Activity size={12} className="animate-pulse" /> LIVE
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg border-2 border-white shadow-sm">
          {chat.userId?.name?.[0] || 'U'}
        </div>
        <div>
          <p className="font-bold text-gray-900">{chat.userId?.name}</p>
          <p className="text-xs text-gray-500">Chatting with {chat.astrologerId?.name}</p>
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded-lg mb-4 flex justify-between items-center">
        <span className="text-xs text-gray-500 font-medium uppercase">Current Duration</span>
        <div className="flex items-center gap-1 text-blue-700 font-mono font-bold">
          <Timer size={14} />
          {durationMin} mins
        </div>
      </div>

      {/* Wrap buttons in a flex container */}
      <div className="flex gap-2">
        <button 
          onClick={onEnd}
          disabled={isEnding}
          className="flex-1 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Square size={14} fill="currentColor" />
          {isEnding ? 'Ending...' : 'Force End'}
        </button>
        <button 
          onClick={() => onView(chat.sessionId)}
          className="flex-1 py-2 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-100 transition flex items-center justify-center gap-2"
        >
          <Eye size={14} />
          Monitor
        </button>
      </div>
    </div>
  );
}

// NEW: ChatViewerModal component added to the bottom
function ChatViewerModal({ sessionId, onClose }: { sessionId: string; onClose: () => void }) {
  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-chat-messages', sessionId],
    queryFn: async () => {
      // Make sure adminApi.getChatMessages is defined in your src/lib/api.ts
      const response = await adminApi.getChatMessages(sessionId);
      return response.data?.data?.messages || response.data?.data || [];
    },
    refetchInterval: 5000 
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b flex justify-between items-center z-10">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="text-blue-600" size={20} />
              Security & Fraud Monitoring
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-1">Session ID: {sessionId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Chat Canvas */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : messages?.length > 0 ? (
            messages.map((msg: any) => {
              const isUser = msg.senderType === 'User' || msg.senderModel === 'User' || msg.sender === 'user';
              
              return (
                <div key={msg._id || msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl max-w-[80%] ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                      : 'bg-white border shadow-sm rounded-tl-sm text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content || msg.message}</p>
                    <span className={`text-[10px] mt-1 block font-medium ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                      {isUser ? 'User' : 'Astrologer'} • {new Date(msg.createdAt || msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="h-full flex items-center justify-center flex-col text-gray-400 gap-2">
              <MessageCircle size={40} className="opacity-20" />
              <p>No messages recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}