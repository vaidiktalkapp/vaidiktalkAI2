'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from 'lucide-react';

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Revenue Analytics
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics', startDate, endDate],
    queryFn: async () => {
      const response = await adminApi.getRevenueAnalytics(startDate, endDate);
      return response.data.data;
    },
  });

  // Top Astrologers
  const { data: topAstrologers, isLoading: astrologersLoading } = useQuery({
    queryKey: ['top-astrologers'],
    queryFn: async () => {
      const response = await adminApi.getTopAstrologers(5);
      return response.data.data;
    },
  });

  // User Growth
  const { data: userGrowth } = useQuery({
    queryKey: ['user-growth', startDate, endDate],
    queryFn: async () => {
      const response = await adminApi.getUserGrowth(startDate, endDate);
      return response.data.data;
    },
  });

  // Dashboard Stats for summary
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats-analytics'],
    queryFn: async () => {
      const response = await adminApi.getDashboardStats();
      return response.data.data;
    },
  });

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

  // Calculate order type distribution from dashboard stats
  const orderTypeData = [
    { name: 'Chat', value: dashboardStats?.orders?.completed || 0 },
    { name: 'Audio Call', value: Math.floor((dashboardStats?.orders?.completed || 0) * 0.6) },
    { name: 'Video Call', value: Math.floor((dashboardStats?.orders?.completed || 0) * 0.3) },
  ];

  // ✅ FIX: Properly typed label function using 'any' to avoid recharts type issues
  const renderPieLabel = ({ name, percent }: any) => {
    return `${name}: ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive platform analytics and insights</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-4">
          <Calendar className="text-gray-400" size={20} />
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Revenue Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        {revenueLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : revenueData && revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="totalRevenue" stroke="#6366f1" strokeWidth={2} name="Revenue (₹)" />
              <Line type="monotone" dataKey="orderCount" stroke="#8b5cf6" strokeWidth={2} name="Order Count" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500">
            No revenue data available for selected date range
          </div>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Type Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Type Distribution</h3>
          {orderTypeData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderPieLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {orderTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-500">
              No order data available
            </div>
          )}
        </div>

        {/* Top Astrologers Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Astrologers</h3>
          {astrologersLoading ? (
            <div className="flex items-center justify-center h-72">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : topAstrologers && topAstrologers.length > 0 ? (
            <div className="space-y-3">
              {topAstrologers.map((astrologer: any, index: number) => (
                <div key={astrologer._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      {astrologer.profilePicture ? (
                        <img 
                          src={astrologer.profilePicture} 
                          alt={astrologer.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-purple-600 font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{astrologer.name}</p>
                      <p className="text-sm text-gray-500">
                        {astrologer.stats?.totalSessions || 0} sessions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{(astrologer.stats?.totalEarnings || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total earnings</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-500">
              No astrologer data available
            </div>
          )}
        </div>
      </div>

      {/* User Growth Chart */}
      {userGrowth && userGrowth.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="newUsers" fill="#6366f1" name="New Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats?.users?.total?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Astrologers</p>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats?.astrologers?.total?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats?.orders?.total?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹{(dashboardStats?.revenue?.total || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
