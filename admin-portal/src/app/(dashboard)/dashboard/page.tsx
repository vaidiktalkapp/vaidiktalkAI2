'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { usePermission } from '@/hooks/use-permission';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, Users, DollarSign, Activity, ShoppingCart } from 'lucide-react';

export default function DashboardPage() {
  const { user } = usePermission();
  const [timeRange, setTimeRange] = useState('7');

  // 1. Fetch Summary Stats (Real-time counters & Net Revenue)
  const { data: analytics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboardStats();
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  // 2. Fetch Revenue Chart Data
  const { data: chartData, isLoading: isLoadingChart } = useQuery({
    queryKey: ['revenue-analytics', timeRange],
    queryFn: async () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(timeRange));

      const response = await adminApi.getRevenueAnalytics(
        start.toISOString(),
        end.toISOString()
      );

      // Map API response to Recharts format
      return response.data.data.map((item: any) => ({
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: item.amount || 0,
        orders: item.orders || 0
      }));
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋
        </h1>
        <p className="text-gray-500 mt-2">Here's what's happening in your platform today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatWidget
          label="Net Revenue"
          value={`₹${analytics?.financials?.netRevenue?.toLocaleString() || 0}`}
          subtext="Real earnings (Commission + Penalties - Bonus)"
          icon={DollarSign}
          color="text-green-600"
          bg="bg-green-50"
          loading={isLoadingStats}
        />
        <StatWidget
          label="Total Users"
          value={analytics?.users?.total?.toLocaleString() || 0}
          subtext={`${analytics?.users?.active || 0} Active`}
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          loading={isLoadingStats}
        />
        <StatWidget
          label="Live Astrologers"
          value={analytics?.astrologers?.online?.toLocaleString() || 0}
          subtext={`of ${analytics?.astrologers?.total || 0} Registered`}
          icon={Activity}
          color="text-purple-600"
          bg="bg-purple-50"
          loading={isLoadingStats}
        />
        <StatWidget
          label="Active Orders"
          value={analytics?.orders?.active?.toLocaleString() || 0}
          subtext="Calls & Chats in progress"
          icon={ShoppingCart}
          color="text-orange-600"
          bg="bg-orange-50"
          loading={isLoadingStats}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Revenue Overview</h3>
              <p className="text-xs text-gray-500">Gross transaction volume over time</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border-gray-200 rounded-lg text-gray-600 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            >
              <option value="7">Last 7 Days</option>
              <option value="14">Last 14 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          <div className="h-[350px] w-full flex-1 min-h-0">
            {isLoadingChart ? (
              <div className="h-full w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            ) : !chartData || chartData.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                No revenue data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#4f46e5' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="h-[450px]">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

function StatWidget({ label, value, subtext, icon: Icon, color, bg, loading }: any) {
  if (loading) {
    return <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-32 animate-pulse" />;
  }
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${bg}`}>
        <Icon size={24} className={color} />
      </div>
    </div>
  );
}