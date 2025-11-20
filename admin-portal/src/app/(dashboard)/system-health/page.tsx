'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Activity, Database, TrendingUp, Clock } from 'lucide-react';

export default function SystemHealthPage() {
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      const response = await adminApi.getSystemHealth();
      return response.data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
        <p className="text-gray-600 mt-1">Monitor overall system performance</p>
      </div>

      {/* Status Timestamp */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          Last updated: {new Date(health?.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Collections Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shopify Orders</p>
              <p className="text-3xl font-bold text-gray-900">
                {health?.collections?.shopifyOrders?.toLocaleString() || 0}
              </p>
            </div>
            <Database className="text-indigo-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remedies</p>
              <p className="text-3xl font-bold text-gray-900">
                {health?.collections?.remedies?.toLocaleString() || 0}
              </p>
            </div>
            <Database className="text-purple-500" size={40} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consultation Orders</p>
              <p className="text-3xl font-bold text-gray-900">
                {health?.collections?.consultationOrders?.toLocaleString() || 0}
              </p>
            </div>
            <Database className="text-green-500" size={40} />
          </div>
        </div>
      </div>

      {/* Last 24 Hours */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Clock className="mr-2 text-blue-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Last 24 Hours</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Shopify Orders Synced</p>
            <p className="text-2xl font-bold text-blue-600">
              {health?.last24Hours?.shopifyOrdersSync || 0}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Remedies Suggested</p>
            <p className="text-2xl font-bold text-purple-600">
              {health?.last24Hours?.remediesSuggested || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Sync Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <TrendingUp className="mr-2 text-green-600" size={24} />
          <h3 className="text-lg font-semibold text-gray-900">Sync Performance</h3>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Average Sync Time</p>
            <div className="flex items-end space-x-2">
              <p className="text-3xl font-bold text-gray-900">
                {parseFloat(
                  health?.averageSyncTime?.seconds || '0'
                ).toFixed(2)}
              </p>
              <span className="text-gray-600 mb-1">seconds</span>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              ✓ System is performing optimally
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
