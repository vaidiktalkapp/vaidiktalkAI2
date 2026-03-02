'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { MessageCircle, Timer, Square, Activity, Zap } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { toast } from 'sonner';

interface ChatSession {
    _id: string;
    orderId: string;
    sessionId: string;
    userId: { name: string; phoneNumber?: string; profileImage?: string };
    astrologerId: { name: string; profilePicture?: string };
    status: string;
    createdAt: string;
    messageCount?: number;
}

export default function AiTractionPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    // 1. Fetch Active AI Chats
    const { data: activeChats, isLoading: isLoadingActive } = useQuery({
        queryKey: ['active-ai-chats'],
        queryFn: async () => {
            // We need to pass includeAi: true to bypass the filter
            const response = await adminApi.getAllChats({ status: 'active', limit: 50, includeAi: true } as any);
            // Filter only AI orders just in case
            return response.data.data.orders.filter((chat: any) => chat.orderId?.startsWith('AI-'));
        },
        refetchInterval: 5000,
    });

    // 2. Fetch AI Chat History
    const { data: chatHistory, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['ai-chat-history', page],
        queryFn: async () => {
            const response = await adminApi.getAllChats({ page, limit: 20, includeAi: true } as any);
            return {
                ...response.data.data,
                orders: response.data.data.orders.filter((chat: any) => chat.orderId?.startsWith('AI-'))
            };
        },
    });

    const endChatMutation = useMutation({
        mutationFn: (sessionId: string) => adminApi.forceEndChat(sessionId),
        onSuccess: () => {
            toast.success('AI Chat ended successfully');
            queryClient.invalidateQueries({ queryKey: ['active-ai-chats'] });
            queryClient.invalidateQueries({ queryKey: ['ai-chat-history'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to end chat');
        },
    });

    const columns: Column<ChatSession>[] = [
        {
            header: 'Order ID',
            accessorKey: 'orderId',
            cell: (row) => <span className="font-mono text-xs">{row.orderId}</span>
        },
        {
            header: 'User',
            cell: (row) => <span className="font-medium">{row.userId?.name}</span>
        },
        {
            header: 'AI Astrologer',
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
                <span className={`px-2 py-1 rounded-full text-xs capitalize ${row.status === 'active' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                    row.status === 'ended' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100'
                    }`}>
                    {row.status}
                </span>
            )
        },
        {
            header: 'Date',
            cell: (row) => new Date(row.createdAt).toLocaleDateString()
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Zap className="text-indigo-600" /> AI Chat Traction
                    </h1>
                    <p className="text-sm text-gray-500">Live monitoring of AI astrologer sessions</p>
                </div>
            </div>

            {/* Live Active Chats */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                        </span>
                        Live AI Chats ({activeChats?.length || 0})
                    </h2>
                </div>

                {isLoadingActive ? (
                    <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
                ) : activeChats?.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
                        <p className="text-gray-500">No AI chats currently active.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeChats?.map((chat: ChatSession) => (
                            <ActiveChatCard
                                key={chat._id}
                                chat={chat}
                                onEnd={() => endChatMutation.mutate(chat.sessionId)}
                                isEnding={endChatMutation.isPending && endChatMutation.variables === chat.sessionId}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* History */}
            <section>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Recent AI Chats</h2>
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
        </div>
    );
}

function ActiveChatCard({ chat, onEnd, isEnding }: { chat: ChatSession; onEnd: () => void; isEnding: boolean }) {
    const startTime = new Date(chat.createdAt).getTime();
    const durationMin = Math.floor((Date.now() - startTime) / 60000);

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:border-indigo-200 transition-all">
            <div className="absolute top-0 right-0 p-2 bg-indigo-50 rounded-bl-xl text-indigo-700 text-xs font-bold flex items-center gap-1">
                <Activity size={12} className="animate-pulse" /> LIVE AI
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-md">
                    {chat.userId?.name?.[0] || 'U'}
                </div>
                <div>
                    <p className="font-bold text-gray-900">{chat.userId?.name}</p>
                    <p className="text-xs text-gray-500">Consulting {chat.astrologerId?.name}</p>
                </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg mb-4 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium uppercase">Current Duration</span>
                <div className="flex items-center gap-1 text-indigo-700 font-mono font-bold">
                    <Timer size={14} />
                    {durationMin} mins
                </div>
            </div>

            <button
                onClick={onEnd}
                disabled={isEnding}
                className="w-full py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <Square size={14} fill="currentColor" />
                {isEnding ? 'Ending...' : 'Force End AI Chat'}
            </button>
        </div>
    );
}
