'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts';
import {
  TrendingUp, Users, ShoppingBag, Target,
  ChevronDown, Calendar, Download, Filter, Clock, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [isExporting, setIsExporting] = useState(false);

  // Fetch Overall Stats (Metrics)
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['ai-astrologer-stats', timeRange],
    queryFn: async () => {
      const { data } = await adminApi.getAIAstrologersStats();
      return data.data;
    },
    refetchInterval: 10000, // Real-time updates every 10 seconds
  });

  // Fetch Performance Metrics (Top Personalities)
  const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    queryKey: ['ai-astrologer-performance', timeRange],
    queryFn: async () => {
      const { data } = await adminApi.getAIAstrologerPerformanceMetrics({ limit: 10, timeRange });
      return data.data.items || [];
    },
    refetchInterval: 5000, // Real-time updates
  });

  // Fetch Overall Charts Data
  const { data: overallStatsData, isLoading: isLoadingOverall } = useQuery({
    queryKey: ['ai-astrologer-overall-stats', timeRange],
    queryFn: async () => {
      const response = await adminApi.getAIAstrologerOverallStats(timeRange);
      return response.data?.data || {};
    },
    refetchInterval: 10000,
  });

  const revenueData = overallStatsData?.revenueChart || [];
  const timeSlotData = overallStatsData?.peakHours || [];
  const astrologerStats = performanceData || [];
  const metrics = statsData;

  const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74', '#fed7aa'];

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      const { data } = await adminApi.exportAIAstrologersData('csv');

      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai_astrologer_analytics_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Analytics</h1>
          <p className="text-gray-500 mt-1">In-depth performance tracking for AI personalities</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="appearance-none bg-white px-10 py-2 rounded-xl shadow-sm border border-gray-200 text-sm font-medium text-gray-600 hover:border-indigo-300 transition-all outline-none cursor-pointer"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center gap-2 bg-indigo-600 px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all">
          {isLoadingStats ? (
            <div className="w-full h-32 flex items-center justify-center animate-pulse bg-gray-50 rounded-2xl" />
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">Average Session</p>
                <h2 className="text-2xl font-bold mt-2 text-gray-900 tracking-tight">{metrics?.averageSessionDuration || 0}s</h2>
                <p className="text-green-600 text-xs font-medium mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Real-time Average
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6 text-indigo-600" />
              </div>
            </>
          )}
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all">
          {isLoadingStats ? (
            <div className="w-full h-32 flex items-center justify-center animate-pulse bg-gray-50 rounded-2xl" />
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                <h2 className="text-2xl font-bold mt-2 text-gray-900 tracking-tight">
                  {metrics?.growthRate > 0 ? '+' : ''}{metrics?.growthRate || 0}%
                </h2>
                <p className="text-indigo-600 text-xs font-medium mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Session Growth Today
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
            </>
          )}
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all">
          {isLoadingStats ? (
            <div className="w-full h-32 flex items-center justify-center animate-pulse bg-gray-50 rounded-2xl" />
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <h2 className="text-2xl font-bold mt-2 text-gray-900 tracking-tight">{metrics?.totalUsers || 0}</h2>
                <p className="text-emerald-600 text-xs font-medium mt-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> Registered Base
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-emerald-600" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Revenue Chart */}
        <div className="lg:col-span-2 space-y-8">
          {/* Revenue Deep Dive */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Revenue Performance ({timeRange.charAt(0).toUpperCase() + timeRange.slice(1)})
            </h3>
            {isLoadingOverall ? (
              <div className="h-96 w-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(dateStr) => {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                      }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value: number) => `₹${value >= 1000 ? `${value / 1000}k` : value}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Revenue Share */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-full">
          <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-gray-900">
            <Target className="w-5 h-5 text-indigo-600" />
            Revenue Share
          </h3>
          {isLoadingPerformance ? (
            <div className="h-64 w-full flex items-center justify-center text-indigo-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : astrologerStats.length === 0 ? (
            <div className="h-64 w-full flex items-center justify-center text-slate-400 font-bold text-xs uppercase tracking-widest">
              No Share Data
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={astrologerStats}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="totalRevenue"
                    >
                      {astrologerStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue Share']}
                      contentStyle={{ borderRadius: '12px', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 space-y-3">
                {astrologerStats.slice(0, 5).map((astro: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-xs font-bold text-slate-600">{astro.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      {Math.round((astro.totalRevenue / astrologerStats.reduce((a: any, b: any) => a + (b.totalRevenue || 0), 0)) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Full-width Row: Peak Activity Analysis */}
        <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-3">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-gray-900">
              <Clock className="w-5 h-5 text-indigo-600" />
              Peak Activity Hours
            </h3>
            {isLoadingOverall ? (
              <div className="h-40 w-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSlotData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      axisLine={false}
                      interval={3} // Show every 4th hour to avoid clutter (12 AM, 4 AM, 8 AM, 12 PM, 4 PM, 8 PM)
                      tickFormatter={(h) => {
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        return `${displayHour} ${ampm}`;
                      }}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, 'auto']}
                      minTickGap={1}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }}
                      formatter={(value: number) => [`${value} Sessions`, 'Peak Demand']}
                      labelFormatter={(h: string) => {
                        const hour = parseInt(h);
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHour = hour % 12 || 12;
                        return `${displayHour}:00 ${ampm}`;
                      }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="sessions" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={35} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-center">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center md:text-left">High Demand Summary</h4>
            <div className="space-y-4">
              <div className="flex md:flex-col justify-between items-center md:items-start">
                <p className="text-sm font-medium text-gray-500">Peak Hour</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {timeSlotData.length > 0
                    ? (() => {
                      const peak = [...timeSlotData].sort((a, b) => b.sessions - a.sessions)[0];
                      const hour = peak.hour;
                      const ampm = hour >= 12 ? 'PM' : 'AM';
                      const displayHour = hour % 12 || 12;
                      return `${displayHour}:00 ${ampm}`;
                    })()
                    : 'N/A'}
                </p>
              </div>
              <div className="flex md:flex-col justify-between items-center md:items-start pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                <p className="text-sm font-medium text-gray-500">Peak Demand</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {timeSlotData.length > 0
                    ? `${[...timeSlotData].sort((a, b) => b.sessions - a.sessions)[0].sessions} Sessions`
                    : '0 Sessions'}
                </p>
              </div>
              <div className="pt-4 border-t border-gray-200 hidden md:block">
                <p className="text-[10px] font-medium text-gray-400 italic leading-relaxed">Recommendation: Increase AI capacity during these hours to maintain &lt;4s response time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Top Performing AI Personalities
          </h3>
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-white transition-all">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50 text-left text-[10px] uppercase font-bold text-gray-400">
            <tr>
              <th className="px-6 py-4">Astrologer</th>
              <th className="px-6 py-4">Total Revenue</th>
              <th className="px-6 py-4">Avg Session</th>
              <th className="px-6 py-4">Conversion</th>
              <th className="px-6 py-4">Satisfaction</th>
              <th className="px-6 py-4">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoadingPerformance ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                </td>
              </tr>
            ) : astrologerStats.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-xs text-gray-400 font-bold">
                  No performance data available for this period.
                </td>
              </tr>
            ) : (
              astrologerStats.map((astro: any, idx: number) => (
                <tr key={idx} className="hover:bg-indigo-50/20 transition-all border-b border-gray-50 last:border-0">
                  <td className="px-6 py-4 font-bold text-sm text-gray-900">{astro.name}</td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-600">
                    ₹{astro.totalRevenue || astro.totalEarnings || 0}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                    {astro.averageLatency ? `${astro.averageLatency.toFixed(1)}s` : (astro.averageSessionDuration ? `${Math.round(astro.averageSessionDuration / 60)}m` : '0s')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold ${astro.conversionRate > 20 ? 'text-emerald-600' : 'text-gray-600'}`}>
                      {astro.conversionRate || 0}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${astro.averageAccuracy || (astro.satisfactionScore || 0) * 20}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400">
                        {astro.averageAccuracy ? `${Math.round(astro.averageAccuracy)}%` : `${((astro.satisfactionScore || 0) * 20).toFixed(0)}%`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
