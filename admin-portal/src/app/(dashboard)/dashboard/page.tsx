'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { usePermission } from '@/hooks/use-permission';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Loader2, Users, IndianRupee, Activity, ShoppingCart, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = usePermission();
  const [timeRange, setTimeRange] = useState('7');

  // 1. Fetch Summary Stats
  const { data: analytics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboardStats();
      return response.data.data;
    },
    refetchInterval: 30000, 
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

      // ✅ FIX: Correctly map backend keys (gross/net) to chart
      return response.data.data.map((item: any) => ({
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: item.gross || 0, // Using Gross Revenue for top-level view
        net: item.net || 0,
        orders: item.orders || 0
      }));
    },
  });

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}! 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening in your platform today.</p>
        </div>
        <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatWidget
          label="Net Revenue"
          value={`₹${analytics?.financials?.netRevenue?.toLocaleString() || 0}`}
          subtext="After commissions & bonuses"
          icon={IndianRupee}
          color="text-emerald-600"
          bg="bg-emerald-50"
          loading={isLoadingStats}
        />
        <StatWidget
          label="Total Users"
          value={analytics?.totalUsers?.toLocaleString() || 0} // ✅ Fixed key mapping
          subtext="Registered accounts"
          icon={Users}
          color="text-blue-600"
          bg="bg-blue-50"
          loading={isLoadingStats}
        />
        <StatWidget
          label="Total Astrologers"
          value={analytics?.totalAstrologers?.toLocaleString() || 0}
          subtext="Onboarded experts"
          icon={Activity}
          color="text-purple-600"
          bg="bg-purple-50"
          loading={isLoadingStats}
        />
        <StatWidget
          label="Total Orders"
          value={analytics?.totalOrders?.toLocaleString() || 0}
          subtext="Lifetime processed"
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
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" /> Revenue Trend
              </h3>
              <p className="text-xs text-gray-500 mt-1">Gross transaction volume</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border-gray-200 rounded-lg text-gray-600 focus:ring-indigo-500 focus:border-indigo-500 outline-none py-1.5"
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
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value >= 1000 ? `${value/1000}k` : value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Gross Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-lg transition-all duration-200 group">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-2 ${color} tracking-tight`}>{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
      </div>
      <div className={`p-3 rounded-xl ${bg} group-hover:scale-110 transition-transform`}>
        <Icon size={24} className={color} />
      </div>
    </div>
  );
}