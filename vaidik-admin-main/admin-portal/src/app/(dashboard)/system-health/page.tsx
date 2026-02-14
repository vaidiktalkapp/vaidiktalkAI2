'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Activity, Database, TrendingUp, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function SystemHealthPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await adminApi.getSystemHealth();
      return response.data.data;
    },
    refetchInterval: 30000, // 30s refresh
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Determine Status Icon
  const StatusIcon = health?.status === 'healthy' ? CheckCircle : 
                     health?.status === 'warning' ? AlertTriangle : XCircle;
  
  const statusColor = health?.status === 'healthy' ? 'text-green-600' : 
                      health?.status === 'warning' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-1">Real-time performance and sync monitoring</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border ${health?.status === 'healthy' ? 'border-green-200' : 'border-red-200'}`}>
          <StatusIcon className={statusColor} size={20} />
          <span className={`capitalize font-medium ${statusColor}`}>{health?.status || 'Unknown'}</span>
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-2 rounded-lg w-fit">
        <Clock size={14} />
        <span>Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Just now'}</span>
      </div>

      {/* Collections Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Shopify Orders" 
          value={health?.collections?.shopifyOrders} 
          icon={Database} 
          color="text-indigo-600" 
        />
        <StatCard 
          label="Remedies DB" 
          value={health?.collections?.remedies} 
          icon={Activity} 
          color="text-purple-600" 
        />
        <StatCard 
          label="Consultations" 
          value={health?.collections?.consultationOrders} 
          icon={Database} 
          color="text-green-600" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Last 24 Hours Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Clock className="mr-2 text-blue-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">24-Hour Throughput</h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700 font-medium">Shopify Orders Synced</span>
              <span className="text-2xl font-bold text-blue-700">
                {health?.last24Hours?.shopifyOrdersSync?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <span className="text-gray-700 font-medium">Remedies Generated</span>
              <span className="text-2xl font-bold text-purple-700">
                {health?.last24Hours?.remediesSuggested?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <TrendingUp className="mr-2 text-green-600" size={24} />
            <h3 className="text-lg font-bold text-gray-900">Performance Metrics</h3>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-gray-500 mb-2">Average Sync Latency</p>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold text-gray-900">
                {health?.averageSyncTime?.seconds || '0.0'}
              </span>
              <span className="text-gray-500 font-medium">sec</span>
            </div>
            <div className="mt-4 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
              OPTIMAL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {value?.toLocaleString() || 0}
        </p>
      </div>
      <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>
        <Icon size={32} />
      </div>
    </div>
  );
}