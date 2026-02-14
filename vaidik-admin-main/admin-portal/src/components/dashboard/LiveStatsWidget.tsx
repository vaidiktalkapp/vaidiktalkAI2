'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { TrendingUp, Users, Video, IndianRupee, Loader2 } from 'lucide-react';

export default function LiveStatsWidget() {
  // Polling every 10 seconds for "near-real-time" feel without complex socket setup for simple stats
  const { data, isLoading } = useQuery({
    queryKey: ['live-dashboard-stats'],
    queryFn: async () => {
      const response = await adminApi.getDashboardStats();
      return response.data.data;
    },
    refetchInterval: 10000, 
  });

  if (isLoading) {
    return <div className="grid grid-cols-4 gap-4 h-32 animate-pulse"><div className="col-span-4 bg-gray-100 rounded-lg"></div></div>;
  }

  const stats = [
    {
      label: 'Active Users',
      value: data?.users?.active || 0,
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
      trend: '+12% from yesterday'
    },
    {
      label: 'Live Streams',
      value: data?.liveStreams || 0,
      icon: Video,
      color: 'text-red-600',
      bg: 'bg-red-50',
      trend: 'Peak hours'
    },
    {
      label: 'Orders Today',
      value: data?.orders?.today || 0,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      trend: 'On track'
    },
    {
      label: 'Revenue Today',
      value: `₹${(data?.revenue?.today || 0).toLocaleString()}`,
      icon: IndianRupee,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      trend: 'Verified'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-400">
            <span className="font-medium text-green-600 mr-2">{stat.trend}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
