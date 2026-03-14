'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import aiAstrologerService, { AiChatOrder, AiChatMessage } from '@/lib/aiAstrologerService';
import chatService from '@/lib/chatService';
import { useAuth } from '@/context/AuthContext';
import {
    MessageSquare, Clock, Calendar, ChevronRight, ChevronDown,
    Search, Filter, IndianRupee, Trash2, X, Sparkles,
    Download, Share2, TrendingUp, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import io from 'socket.io-client';
import { renderMessageContent } from '@/lib/renderUtils';

const AiChatHistoryPage = () => {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [history, setHistory] = useState<AiChatOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<AiChatOrder | null>(null);
    const [sessionMessages, setSessionMessages] = useState<AiChatMessage[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const socketRef = useRef<any>(null);

    useEffect(() => {
        if (isAuthenticated) {
            fetchHistory();
            setupSocketConnection();
        } else if (!loading && !isAuthenticated) {
            router.push('/');
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                console.log('[SOCKET] Disconnected from history page');
            }
        };
    }, [isAuthenticated]);

    const setupSocketConnection = () => {
        if (socketRef.current) return; // Prevent duplicate connections

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://vaidiktalk-server1.onrender.com';
        const token = localStorage.getItem('accessToken');

        if (!token) return;

        socketRef.current = io(`${socketUrl}/ai-chat`, {
            auth: {
                token,
                userId: user?._id,
                role: 'User'
            },
            transports: ['websocket']
        });

        console.log('[SOCKET] Connecting to history updates...');

        // Listen for session status updates
        socketRef.current.on('session-status-update', (data: any) => {
            console.log('[SOCKET] Session status update received:', data);

            if (data.status === 'ended' || data.status === 'insufficient_funds') {
                // Refresh history when any session ends
                fetchHistory();

                // If viewing this session, close modal
                if (selectedSession?._id === data.sessionId) {
                    setSelectedSession(null);
                    toast('This session has been updated', { icon: 'ℹ️' });
                }
            }
        });

        // Listen for session ended event
        socketRef.current.on('session-ended', (data: any) => {
            console.log('[SOCKET] Session ended:', data);
            fetchHistory(); // Refresh the list
        });

        socketRef.current.on('connect', () => {
            console.log('[SOCKET] Connected to history updates');
        });

        socketRef.current.on('disconnect', () => {
            console.log('[SOCKET] Disconnected from history updates');
        });

        socketRef.current.on('error', (error: any) => {
            console.error('[SOCKET] Socket error:', error);
        });
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await aiAstrologerService.getAiChatHistory(1, 100);

            if (response.success) {
                const data = Array.isArray(response.data) ? response.data : [];
                console.log('[HISTORY] Fetched sessions:', data.length);

                // Additional client-side safety filter
                const validSessions = data.filter((session: AiChatOrder) => {
                    // Only show sessions that are ended or active but we show ended here for history
                    const isEnded = (session.status as string) === 'ended' || (session.status as string) === 'insufficient_funds';

                    // And have some substance (duration > 0 OR has messages)
                    const hasSubstance = (session.duration && session.duration > 0) || (session.messages && session.messages.length > 0);

                    return isEnded && hasSubstance;
                });

                console.log('[HISTORY] Valid sessions after filter:', validSessions.length);
                setHistory(validSessions);
            }
        } catch (error) {
            console.error('[HISTORY] Failed to load history:', error);
            toast.error('Failed to load chat history');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (session: AiChatOrder) => {
        setSelectedSession(session);
        setLoadingMessages(true);

        try {
            const order = await aiAstrologerService.getAiChatConversation(session._id);
            console.log('[MESSAGES] Loaded messages:', order.messages?.length);
            setSessionMessages(order.messages || []);
        } catch (error) {
            console.error('[MESSAGES] Failed to load:', error);
            toast.error('Failed to load conversation logs');
            setSessionMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this chat consultation? This action cannot be undone."
        );

        if (!confirmed) return;

        try {
            const response = await aiAstrologerService.deleteAiChatOrder(sessionId);
            if (response.success) {
                toast.success('Consultation deleted successfully');

                // Remove from local state
                setHistory(prev => prev.filter(s => s._id !== sessionId));

                // Close modal if viewing deleted session
                if (selectedSession?._id === sessionId) {
                    setSelectedSession(null);
                }
            } else {
                toast.error(response.message);
            }
        } catch (error: any) {
            console.error('[DELETE] Failed:', error);
            toast.error(error.response?.data?.error || 'Failed to delete consultation');
        }
    };

    const handleConsultAgain = (session: AiChatOrder) => {
        // Redirect to the general AI astrologers listing page as requested
        router.push(`/ai-astrologer-chat`);
    };

    const handleExportSession = (session: AiChatOrder) => {
        // Create formatted text content instead of JSON
        const astrologerName = session.astrologer?.name || 'AI Astrologer';
        const dateStr = session.startedAt ? new Date(session.startedAt).toLocaleString('en-IN') : 'N/A';
        const durationStr = session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : '0m 0s';
        const costStr = `₹${Number(session.totalCost || 0).toFixed(2)}`;

        let content = `VAIDIK TALK - AI ASTROLOGY CONSULTATION\n`;
        content += `==========================================\n\n`;
        content += `Astrologer: ${astrologerName}\n`;
        content += `Date: ${dateStr}\n`;
        content += `Duration: ${durationStr}\n`;
        content += `Total Cost: ${costStr}\n`;
        content += `Session ID: ${session._id}\n\n`;
        content += `------------------------------------------\n`;
        content += `CONVERSATION LOG\n`;
        content += `------------------------------------------\n\n`;

        if (sessionMessages && sessionMessages.length > 0) {
            sessionMessages.forEach(msg => {
                const sender = msg.senderModel === 'User' ? (user?.name || 'You') : astrologerName;
                const time = new Date(msg.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                content += `[${time}] ${sender}:\n${msg.content}\n\n`;
            });
        } else {
            content += `(No message transcripts available for this session export)\n`;
        }

        content += `==========================================\n`;
        content += `Generated on ${new Date().toLocaleString()}\n`;

        const blob = new Blob([content], {
            type: 'text/plain;charset=utf-8'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = astrologerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `astrology_${safeName}_${session._id.substring(0, 8)}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success('Session exported as TXT');
    };

    // Filter and search logic
    const filteredHistory = history.filter(session => {
        const matchesSearch = searchQuery === '' ||
            session.astrologer?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = filterStatus === 'all' || session.status === filterStatus;

        return matchesSearch && matchesFilter;
    });

    // Calculate stats
    const totalSessions = history.length;
    const totalDuration = history.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalMessages = history.reduce((sum, s) => sum + (s.totalMessages || 0), 0);
    const totalSpend = history.reduce((sum, s) => sum + (Number(s.totalCost) || 0), 0);

    const getImageUrl = (url?: string, name: string = 'AI') => {
        if (url && url.trim() !== '') return url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FB923C&color=fff&bold=true`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header with Stats */}
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                            <button
                                onClick={() => router.push('/ai-astrologer-chat')}
                                className="p-2 hover:bg-orange-100 rounded-full transition-colors shrink-0"
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 truncate">
                                    Chat <span className="text-orange-600">History</span>
                                </h1>
                                <p className="text-xs md:text-gray-600 mt-1 truncate">Your divine consultations</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 border border-orange-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm w-full sm:w-48"
                                />
                            </div>

                            <div className="relative flex-1 sm:flex-none">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 border border-orange-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none cursor-pointer"
                                >
                                    <option value="all">All Sessions</option>
                                    <option value="ended">Completed</option>
                                    <option value="insufficient_funds">Ended Early</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-orange-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider truncate">Total</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 md:mt-1">{totalSessions}</p>
                                </div>
                                <div className="bg-orange-100 p-2 md:p-3 rounded-lg md:rounded-xl shrink-0">
                                    <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-orange-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider truncate">Time</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 md:mt-1">
                                        {Math.floor(totalDuration / 60)}m
                                    </p>
                                </div>
                                <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl shrink-0">
                                    <Clock className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-orange-100 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider truncate">Total Spend</p>
                                    <p className="text-lg md:text-2xl font-bold text-gray-900 mt-0.5 md:mt-1">₹{totalSpend.toFixed(2)}</p>
                                </div>
                                <div className="bg-green-100 p-2 md:p-3 rounded-lg md:rounded-xl shrink-0">
                                    <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    {loading ? (
                        // Loading skeletons
                        [1, 2, 3].map(i => (
                            <div
                                key={i}
                                className="bg-white p-6 rounded-3xl h-28 animate-pulse border border-orange-100 shadow-sm"
                            />
                        ))
                    ) : filteredHistory.length > 0 ? (
                        filteredHistory.map((session, idx) => (
                            <motion.div
                                key={session._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleViewDetails(session)}
                                className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100 hover:shadow-xl hover:border-orange-300 transition-all group cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                    {/* Left: Astrologer Info */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="relative">
                                            <img
                                                src={getImageUrl(session.astrologer?.profileImage, session.astrologer?.name)}
                                                className="w-16 h-16 rounded-2xl object-cover border-2 border-orange-100 group-hover:scale-105 transition-transform"
                                                alt={session.astrologer?.name || 'Astrologer'}
                                                onError={(e: any) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(session.astrologer?.name || 'AI')}&background=FB923C&color=fff&bold=true`;
                                                }}
                                            />
                                            <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-lg shadow-md">
                                                <MessageSquare className="w-3 h-3 text-orange-600" />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors text-lg truncate">
                                                {session.astrologer?.name || 'AI Astrologer'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                <span className="flex items-center text-xs font-semibold text-gray-500">
                                                    <Calendar className="w-3 h-3 mr-1" />
                                                    {session.startedAt ? new Date(session.startedAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    }) : 'N/A'}
                                                </span>
                                                <span className="flex items-center text-xs font-semibold text-gray-500">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {session.duration ? `${Math.floor(session.duration / 60)}m ${session.duration % 60}s` : '0m 0s'}
                                                </span>
                                                <span className="flex items-center text-xs font-semibold text-orange-600">
                                                    <Sparkles className="w-3 h-3 mr-1" />
                                                    {session.totalMessages || 0} messages
                                                </span>
                                                <span className="flex items-center text-xs font-semibold text-green-600">
                                                    <IndianRupee className="w-3 h-3 mr-0.5" />
                                                    ₹{Number(session.totalCost || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Status and Actions */}
                                    <div className="flex items-center gap-4 md:gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${session.status === 'ended'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {session.status === 'ended' ? 'Completed' : 'Ended Early'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(session._id);
                                                }}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Delete session"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>

                                            <ChevronRight className="w-5 h-5 text-orange-300 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        // Empty state
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-orange-200"
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
                                <MessageSquare className="w-10 h-10 text-orange-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'No matching consultations found'
                                    : 'No chat history yet'
                                }
                            </h3>
                            <p className="text-gray-500 mb-6">
                                {searchQuery || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter'
                                    : 'Your consultations with AI Astrologers will appear here'
                                }
                            </p>
                            {!searchQuery && filterStatus === 'all' && (
                                <button
                                    onClick={() => router.push('/ai-astrologer-chat')}
                                    className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
                                >
                                    Start Your First Consultation
                                </button>
                            )}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Session Details Modal */}
            <AnimatePresence>
                {selectedSession && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedSession(null)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="p-6 bg-gradient-to-r from-orange-600 to-orange-500 text-white">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={getImageUrl(selectedSession.astrologer?.profileImage, selectedSession.astrologer?.name)}
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-lg"
                                            alt={selectedSession.astrologer?.name}
                                            onError={(e: any) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedSession.astrologer?.name || 'AI')}&background=FB923C&color=fff&bold=true`;
                                            }}
                                        />
                                        <div>
                                            <h3 className="font-bold text-xl leading-tight">
                                                {selectedSession.astrologer?.name || 'AI Astrologer'}
                                            </h3>
                                            <p className="text-xs text-orange-100 mt-1 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {selectedSession.startedAt ? new Date(selectedSession.startedAt).toLocaleDateString('en-IN', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                }) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleExportSession(selectedSession)}
                                            className="p-2 hover:bg-orange-700 rounded-xl transition-colors"
                                            title="Export session"
                                        >
                                            <Download className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setSelectedSession(null)}
                                            className="p-2 hover:bg-orange-700 rounded-xl transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 custom-scrollbar">
                                {loadingMessages ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                                        <div className="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-sm font-semibold text-gray-600">Loading conversation...</p>
                                    </div>
                                ) : sessionMessages.length > 0 ? (
                                    sessionMessages.map((msg, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className={`flex ${msg.senderModel === 'User' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm shadow-sm ${msg.senderModel === 'User'
                                                ? 'bg-orange-600 text-white rounded-tr-none'
                                                : 'bg-white border border-orange-100 text-gray-800 rounded-tl-none'
                                                }`}>
                                                {msg.senderModel === 'AiAstrologer' && (
                                                    <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-orange-600">
                                                        <Sparkles className="w-3 h-3" />
                                                        {selectedSession.astrologer?.name || 'AI Astrologer'}
                                                    </div>
                                                )}
                                                <div className="leading-relaxed whitespace-pre-wrap break-words">
                                                    {renderMessageContent(msg.content)}
                                                </div>
                                                <div className={`text-xs mt-2 opacity-60 flex items-center gap-2 ${msg.senderModel === 'User' ? 'justify-end' : 'justify-start'
                                                    }`}>
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(msg.sentAt).toLocaleTimeString('en-IN', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-20">
                                        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-orange-200" />
                                        <p className="text-sm font-semibold text-gray-500">
                                            No messages found for this session
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-5 border-t border-orange-100 bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                Duration
                                            </span>
                                            <span className="text-sm font-bold text-gray-900 mt-0.5">
                                                {selectedSession.duration ? `${Math.floor(selectedSession.duration / 60)}m ${selectedSession.duration % 60}s` : '0m 0s'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                                Amount
                                            </span>
                                            <span className="text-sm font-bold text-green-600 mt-0.5">
                                                ₹{Number(selectedSession.totalCost || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleConsultAgain(selectedSession)}
                                        className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:from-orange-700 hover:to-orange-600 transition-all flex items-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Consult Again
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom scrollbar styles */}
            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fb923c;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f97316;
        }
      `}</style>
        </div>
    );
};

export default AiChatHistoryPage;
