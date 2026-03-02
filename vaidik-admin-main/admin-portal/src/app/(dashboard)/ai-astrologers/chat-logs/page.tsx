'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import {
  MessageSquare, User, Zap, Star, Search, Calendar, Filter,
  ChevronRight, ShieldCheck, AlertCircle, Clock, CheckCircle2,
  Eye, Download, ArrowLeft, TrendingUp, Activity, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { AIAstrologerChatLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Message interface
interface ChatMessage {
  _id: string;
  content: string;
  senderModel: 'User' | 'Astrologer' | 'AiAstrologer';
  sentAt: string;
  qualityScore?: number;
  isEnhanced?: boolean;
}

// Session detail interface
interface SessionDetail {
  _id: string;
  sessionId: string;
  orderId: string;
  userId: { _id: string; name: string; avatar?: string; email?: string };
  astrologerId: { _id: string; name: string; image?: string };
  duration: number;
  totalCost: number;
  messageCount: number;
  userSatisfactionRating?: number;
  status: string;
  createdAt: string;
  endTime?: string;
  language?: string;
  userBirthChart?: any;
}

export default function AIChatLogsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [aiAstrologerFilter, setAIAstrologerFilter] = useState('');
  const [resolutionFilter, setResolutionFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch chat logs
  const { data: chatLogs, isLoading } = useQuery({
    queryKey: ['ai-astrologer-chat-logs', page, search, aiAstrologerFilter, resolutionFilter],
    queryFn: async () => {
      const response = await adminApi.getAIAstrologerChatLogs({
        page,
        limit: 20,
        search,
        aiAstrologerId: aiAstrologerFilter || undefined,
        resolution: resolutionFilter || undefined,
      });

      const data = response.data.data || response.data;
      const items = data.items || data.logs || (Array.isArray(data) ? data : []);
      const total = data.pagination?.total || data.total || items.length;
      const pages = data.pagination?.pages || data.pages || 1;

      return { items, total, pages };
    },
    refetchInterval: 5000,
  });

  // Fetch stats - contains global totals
  const { data: stats } = useQuery({
    queryKey: ['ai-astrologer-chat-stats'],
    queryFn: async () => {
      const response = await adminApi.getAIAstrologerChatStats();
      return response.data?.data || response.data;
    },
    refetchInterval: 10000,
  });

  // Fetch revenue analytics for different time ranges
  const { data: dailyRevenue } = useQuery({
    queryKey: ['ai-revenue-daily'],
    queryFn: async () => {
      const response = await adminApi.getAIRevenueAnalytics({ timeRange: 'daily' });
      const result = response.data?.data || response.data;
      return result;
    },
    refetchInterval: 10000,
  });

  const { data: weeklyRevenue } = useQuery({
    queryKey: ['ai-revenue-weekly'],
    queryFn: async () => {
      const response = await adminApi.getAIRevenueAnalytics({ timeRange: 'weekly' });
      const result = response.data?.data || response.data;
      return result;
    },
    refetchInterval: 10000,
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ['ai-revenue-monthly'],
    queryFn: async () => {
      const response = await adminApi.getAIRevenueAnalytics({ timeRange: 'monthly' });
      const result = response.data?.data || response.data;
      return result;
    },
    refetchInterval: 10000,
  });

  // View session details and fetch messages
  const viewSession = async (log: any) => {
    try {
      setLoadingMessages(true);
      const response = await adminApi.getAIAstrologerChatLogDetails(log._id || log.id);
      const sessionData = response.data.data;
      setSelectedSession(sessionData);
      const msgs = sessionData.messages || [];
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (error) {
      console.error('Failed to load session details:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Calculate quality metrics
  const calculateQualityMetrics = () => {
    if (selectedSession && (selectedSession as any).avgAccuracy !== undefined) {
      return {
        accuracy: Math.round((selectedSession as any).avgAccuracy || 0),
        latency: (selectedSession as any).avgLatency ? `${(selectedSession as any).avgLatency.toFixed(1)}s` : 'Fast',
        empathy: (selectedSession as any).avgAccuracy > 70 ? 'High' : 'Medium'
      };
    }
    if (!messages.length) return { accuracy: 0, latency: 'N/A', empathy: 'N/A' };
    const aiMessages = messages.filter(m => m.senderModel === 'AiAstrologer' || m.senderModel === 'Astrologer');
    const avgQuality = aiMessages.reduce((sum, msg) => sum + (msg.qualityScore || 5), 0) / (aiMessages.length || 1);
    const enhancedCount = aiMessages.filter(m => m.isEnhanced).length;
    return {
      accuracy: Math.round((avgQuality / 10) * 100),
      latency: aiMessages.length > 1 ? 'Fast' : 'N/A',
      empathy: enhancedCount > aiMessages.length / 2 ? 'High' : 'Medium'
    };
  };

  const metrics = selectedSession ? calculateQualityMetrics() : { accuracy: 0, latency: 'N/A', empathy: 'N/A' };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              AI Chat <span className="text-indigo-600">Intelligence Logs</span>
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-1">
              Monitor AI quality, session accuracy, and user satisfaction
            </p>
          </div>
        </div>
      </div>
      {/* Stats Cards & Revenue Breakdown */}
      {stats && (
        <div className="space-y-4">
          {/* Main Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 shadow-sm rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Chats</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">{stats.totalChats || stats.totalSessions || 0}</p>
                    <p className="text-[10px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Platform Total
                    </p>
                  </div>
                  <div className="bg-indigo-100 p-2.5 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white border-emerald-100 shadow-sm rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">₹{(stats.totalRevenue || stats.totalEarnings || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> AI Earnings
                    </p>
                  </div>
                  <div className="bg-emerald-100 p-2.5 rounded-lg">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Narrower Revenue Breakdown */}
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5 px-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Revenue Breakdown
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-lg">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Today</p>
                <p className="text-lg font-bold text-gray-900 leading-none mt-1">
                  ₹{(dailyRevenue?.totals?.totalRevenue || dailyRevenue?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-indigo-600 font-bold mt-1">
                  {dailyRevenue?.totals?.totalSessions || dailyRevenue?.totalSessions || 0} sessions
                </p>
              </div>

              <div className="p-2 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-lg">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Week</p>
                <p className="text-lg font-bold text-gray-900 leading-none mt-1">
                  ₹{(weeklyRevenue?.totals?.totalRevenue || weeklyRevenue?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-emerald-600 font-bold mt-1">
                  {weeklyRevenue?.totals?.totalSessions || weeklyRevenue?.totalSessions || 0} sessions
                </p>
              </div>

              <div className="p-2 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-lg">
                <p className="text-[9px] font-bold text-gray-500 uppercase">Month</p>
                <p className="text-lg font-bold text-gray-900 leading-none mt-1">
                  ₹{(monthlyRevenue?.totals?.totalRevenue || monthlyRevenue?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-indigo-600 font-bold mt-1">
                  {monthlyRevenue?.totals?.totalSessions || monthlyRevenue?.totalSessions || 0} sessions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[650px] flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Recent Sessions ({chatLogs?.total || chatLogs?.items?.length || 0})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : chatLogs?.items && chatLogs.items.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {chatLogs.items.map((session: any) => (
                  <motion.div
                    key={session._id}
                    onClick={() => viewSession(session)}
                    className={`p-4 cursor-pointer transition-all hover:bg-indigo-50/50 group relative ${selectedSession?._id === session._id || selectedSession?.sessionId === session.id
                      ? 'bg-indigo-50 border-l-4 border-indigo-600'
                      : ''
                      }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-md">
                          {session.userName?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{session.userName || 'Unknown User'}</div>
                          <div className="text-xs text-gray-500 font-semibold mt-0.5 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {session.aiAstrologerName || 'AI Astrologer'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-indigo-600">₹{session.earnings || 0}</div>
                        <div className="text-[10px] text-gray-400 font-semibold mt-1">
                          {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3" /> {session.duration || 0}m
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                        <MessageSquare className="w-3 h-3" /> {session.messages || 0} msgs
                      </div>
                      <div className={`ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${session.resolution === 'resolved' || session.status === 'ended'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                        }`}>
                        {session.resolution || session.status}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20 text-indigo-600" />
                <p className="text-sm font-bold">No sessions found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {chatLogs && chatLogs.pages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-gray-600">Page {page} of {chatLogs.pages}</span>
              <button
                onClick={() => setPage(p => Math.min(chatLogs.pages, p + 1))}
                disabled={page === chatLogs.pages}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Chat Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
          <AnimatePresence mode="wait">
            {selectedSession ? (
              <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
                <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                        <ShieldCheck className="w-5 h-5 text-indigo-400" /> Session Diagnostics
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">ID: {selectedSession.orderId || selectedSession.sessionId}</p>
                    </div>
                    <button onClick={() => setSelectedSession(null)} className="text-gray-400 hover:text-white">
                      <AlertCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar">
                  {/* Quality Metrics */}
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-600" /> AI Quality
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{metrics.accuracy}/100</div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase mt-1">Accuracy</div>
                      </div>
                      <div className="text-center border-x border-gray-100">
                        <div className="text-2xl font-bold text-emerald-600">{metrics.latency}</div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase mt-1">Latency</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600">{metrics.empathy}</div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase mt-1">Empathy</div>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-3">
                    {loadingMessages ? (
                      <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                    ) : messages.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.senderModel === 'User' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${msg.senderModel === 'User' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                          }`}>
                          {msg.content}
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                          {msg.senderModel} · {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-12 text-center">
                <Activity className="w-16 h-16 mb-6 opacity-10 animate-pulse text-indigo-600" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Diagnostics Engine</h3>
                <p className="text-sm font-medium">Select a session to view analysis.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
