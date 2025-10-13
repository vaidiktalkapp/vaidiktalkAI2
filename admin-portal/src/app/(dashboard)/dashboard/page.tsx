// src/app/(dashboard)/dashboard/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { 
  Users, 
  Star, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboardStats();
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      change: '+12.5%',
      icon: Users,
      color: 'bg-blue-500',
      active: stats?.users?.active || 0,
    },
    {
      title: 'Astrologers',
      value: stats?.astrologers?.total || 0,
      change: '+8.2%',
      icon: Star,
      color: 'bg-purple-500',
      active: stats?.astrologers?.active || 0,
    },
    {
      title: 'Total Orders',
      value: stats?.orders?.total || 0,
      change: '+23.1%',
      icon: ShoppingCart,
      color: 'bg-green-500',
      completed: stats?.orders?.completed || 0,
    },
    {
      title: 'Revenue',
      value: `₹${(stats?.revenue?.total || 0).toLocaleString()}`,
      change: '+15.3%',
      icon: DollarSign,
      color: 'bg-yellow-500',
      today: `₹${(stats?.revenue?.today || 0).toLocaleString()}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</h3>
                  {stat.active !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">Active: {stat.active}</p>
                  )}
                  {stat.completed !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">Completed: {stat.completed}</p>
                  )}
                  {stat.today && (
                    <p className="text-xs text-gray-500 mt-1">Today: {stat.today}</p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
              <div className="mt-3 flex items-center text-sm">
                <TrendingUp className="text-green-500" size={16} />
                <span className="text-green-500 ml-1">{stat.change}</span>
                <span className="text-gray-500 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y">
          {recentActivity.map((activity, index) => (
            <div key={index} className="p-6 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full ${activity.color} flex items-center justify-center`}>
                  <activity.icon className="text-white" size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sample data for charts
const revenueData = [
  { date: 'Jan', revenue: 45000 },
  { date: 'Feb', revenue: 52000 },
  { date: 'Mar', revenue: 48000 },
  { date: 'Apr', revenue: 61000 },
  { date: 'May', revenue: 58000 },
  { date: 'Jun', revenue: 70000 },
];

const ordersData = [
  { type: 'Chat', count: 450 },
  { type: 'Call', count: 320 },
  { type: 'Video', count: 180 },
  { type: 'Report', count: 90 },
];

const recentActivity = [
  {
    icon: Users,
    title: 'New User Registration',
    description: 'John Doe joined the platform',
    time: '5 mins ago',
    color: 'bg-blue-500',
  },
  {
    icon: Star,
    title: 'Astrologer Approved',
    description: 'Dr. Sarah Williams was approved',
    time: '15 mins ago',
    color: 'bg-purple-500',
  },
  {
    icon: ShoppingCart,
    title: 'New Order Completed',
    description: 'Chat session completed - ORD_12345',
    time: '32 mins ago',
    color: 'bg-green-500',
  },
  {
    icon: DollarSign,
    title: 'Payment Received',
    description: 'Wallet recharge of ₹1,500',
    time: '1 hour ago',
    color: 'bg-yellow-500',
  },
];
