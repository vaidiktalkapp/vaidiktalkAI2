'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, Filter, TrendingUp, Sparkles, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

export default function RemediesPage() {
  const [page, setPage] = useState(1);
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['remedies-stats'],
    queryFn: async () => {
      const response = await adminApi.getRemediesStats();
      return response.data.data;
    },
  });

  const { data: conversionData } = useQuery({
    queryKey: ['conversion-tracking'],
    queryFn: async () => {
      const response = await adminApi.getPurchaseConversionTracking();
      return response.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['remedies', page, sourceFilter, statusFilter],
    queryFn: async () => {
      if (sourceFilter) {
        const response = await adminApi.getRemediesBySource(sourceFilter, {
          page,
          limit: 20,
        });
        return response.data.data;
      } else if (statusFilter) {
        const response = await adminApi.getRemediesByStatus(statusFilter, {
          page,
          limit: 20,
        });
        return response.data.data;
      } else {
        const response = await adminApi.getAllRemedies({
          page,
          limit: 20,
        });
        return response.data.data;
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Remedies Management</h1>
          <p className="text-gray-600 mt-1">Monitor astrologer recommendations and purchases</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Suggested</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.summary?.totalRemedies || 0}
              </p>
            </div>
            <Sparkles className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accepted</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.summary?.acceptedRemedies || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.summary?.acceptanceRate}
              </p>
            </div>
            <TrendingUp className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Purchased</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats?.summary?.purchasedRemedies || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.summary?.purchaseRate}
              </p>
            </div>
            <ShoppingCart className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Shopify Products</p>
              <p className="text-2xl font-bold text-indigo-600">
                {stats?.summary?.shopifyProductRemedies || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Manual: {stats?.summary?.manualRemedies || 0}
              </p>
            </div>
            <Sparkles className="text-indigo-500" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Sources</option>
            <option value="manual">Manual Remedies</option>
            <option value="shopify_product">Shopify Products</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="suggested">Suggested</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Conversion Metrics */}
      {conversionData?.conversionMetrics?.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Products - Conversion Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Suggested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Accepted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Purchased
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Conversion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {conversionData.conversionMetrics.slice(0, 10).map((item: any) => (
                  <tr key={item._id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {item._id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.suggested}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.accepted}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {item.purchased}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${Math.min(
                                item.conversionRate,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="ml-2 text-sm font-medium">
                          {item.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Remedies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remedy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Astrologer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchased
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.remedies?.map((remedy: any) => (
                  <tr key={remedy._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {remedy.remedySource === 'manual'
                          ? remedy.title
                          : remedy.shopifyProduct?.productName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {remedy.remedySource === 'manual'
                          ? 'Manual'
                          : 'Shopify Product'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {remedy.remedySource === 'manual'
                          ? remedy.type
                          : remedy.shopifyProduct?.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {remedy.astrologerName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          remedy.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : remedy.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {remedy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          remedy.isPurchased
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {remedy.isPurchased ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(remedy.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {data?.pagination?.pages || 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= (data?.pagination?.pages || 1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
