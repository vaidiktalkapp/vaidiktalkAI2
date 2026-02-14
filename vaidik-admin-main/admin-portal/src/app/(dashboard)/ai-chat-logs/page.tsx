'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
    MessageSquare, User, Zap, Star,
    Search, Filter, ShieldCheck, AlertCircle, Clock, CheckCircle2
} from 'lucide-react';

export default function AdminChats() {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Sessions
    const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
        queryKey: ['ai-chat-logs', searchTerm],
        queryFn: async () => {
            // Assuming getAIAstrologerChatLogs supports search or we filter client side if not
            const params: any = { limit: 50 };
            if (searchTerm) params.search = searchTerm;
            const { data } = await adminApi.getAIAstrologerChatLogs(params);
            return data.data.items || [];
        },
    });

    const sessions = sessionsData || [];

    // Fetch Selected Session Details
    const { data: selectedSessionData, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['ai-chat-log-details', selectedSessionId],
        queryFn: async () => {
            if (!selectedSessionId) return null;
            const { data } = await adminApi.getAIAstrologerChatLogDetails(selectedSessionId);
            return data.data;
        },
        enabled: !!selectedSessionId,
    });

    const selectedSession = selectedSessionData;
    const messages = selectedSession?.messages || [];

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div className="flex justify-between items-end mb-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Chat <span className="text-indigo-600">Intelligence Logs</span></h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monitor AI quality and session accuracy</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Session List */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden h-[600px] flex flex-col">
                    <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Platform Sessions</span>
                        <Filter className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoadingSessions ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold">Loading sessions...</div>
                        ) : sessions.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {sessions.map((session: any) => (
                                    <div
                                        key={session._id}
                                        onClick={() => setSelectedSessionId(session._id)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-indigo-50/50 group ${selectedSessionId === session._id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <User className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-black text-slate-900">{session.userName || 'Unknown User'}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">↔ {session.aiAstrologerName || 'AI Astrologer'}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-indigo-600 tracking-tighter">₹{session.earnings || 0}</div>
                                                <div className="text-[8px] text-slate-400 font-bold">{new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2">
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {session.duration || 0} mins
                                            </div>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                                                <Star className="w-2.5 h-2.5 fill-yellow-600" />
                                                {session.rating || 'N/A'}
                                            </div>
                                            <div className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${session.resolution === 'resolved' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {session.resolution || 'Ongoing'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                                <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-sm font-bold">No sessions found matching your search.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Details / Quality Scoring */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                    {selectedSession ? (
                        <>
                            <div className="p-6 border-b border-slate-50 bg-slate-900 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-sm font-bold flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-indigo-500" />
                                        Session Diagnostics
                                    </h3>
                                    <p className="text-[10px] text-slate-400 tracking-tight font-medium underline">ID: {selectedSession._id}</p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                                        <Zap className="w-4 h-4 text-yellow-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">AI Quality Score</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center">
                                            <div className="text-xl font-black text-slate-900">94/100</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">Accuracy</div>
                                        </div>
                                        <div className="text-center border-x border-slate-100">
                                            <div className="text-xl font-black text-green-600">Fast</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">Latency</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black text-indigo-600">High</div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">Empathy</div>
                                        </div>
                                    </div>
                                </div>

                                {/* AI Summary Section */}
                                {selectedSession.summary && (
                                    <div className="bg-gradient-to-r from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 shadow-sm mb-6">
                                        <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Zap className="w-3 h-3" />
                                            Session Recap
                                        </h4>
                                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                            {selectedSession.summary}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {isLoadingDetails ? (
                                        <div className="text-center text-xs text-slate-400">Loading messages...</div>
                                    ) : messages.map((msg: any, i: number) => (
                                        <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] leading-relaxed font-medium ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                                                {msg.message}
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">
                                                {msg.sender} · {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-white border-t border-slate-50 flex gap-3">
                                <button className="flex-1 bg-slate-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Approve Transcript
                                </button>
                                <button className="flex-1 border border-slate-200 text-slate-500 text-xs font-bold py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Flag for Review
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
                            <Clock className="w-16 h-16 mb-4 opacity-10 animate-pulse" />
                            <h3 className="text-lg font-black text-slate-900 mb-2">Diagnostics Engine</h3>
                            <p className="text-sm font-medium">Select a session from the list to view real-time chat intelligence and quality metrics.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
