'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { usePermission } from '@/hooks/use-permission';
import { 
  TrendingUp, Users, IndianRupee, ShoppingCart, 
  Download, Calendar, BarChart3 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { can } = usePermission();
  
  // Date range - last 30 days by default
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch summary
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary', startDate, endDate],
    queryFn: async () => {
      const response = await adminApi.getDashboardSummary(
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString()
      );
      return response.data.data;
    },
    enabled: can('view_reports'),
  });

  const handleExport = async (type: string) => {
    try {
      let response;
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate).toISOString();

      switch (type) {
        case 'revenue':
          response = await adminApi.exportRevenueReport(start, end);
          break;
        case 'users':
          response = await adminApi.exportUsersReport();
          break;
        case 'astrologers':
          response = await adminApi.exportAstrologersReport();
          break;
        case 'orders':
          response = await adminApi.exportOrdersReport(start, end);
          break;
        default:
          return;
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Report exported successfully');
    } catch (error: any) {
      toast.error('Failed to export report');
    }
  };

  if (!can('view_reports')) {
    return <div className="p-12 text-center text-gray-500">Access Denied</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive business insights</p>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Calendar className="text-gray-400" size={20} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => {
              setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Revenue Summary */}
          <ReportSection
            title="Revenue Overview"
            icon={IndianRupee}
            color="green"
            exportAction={() => handleExport('revenue')}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                label="Total Revenue" 
                value={`₹${(summary?.revenue?.summary?.totalRevenue || 0).toLocaleString()}`}
                color="text-green-600"
              />
              <MetricCard 
                label="Total Orders" 
                value={summary?.revenue?.summary?.totalOrders || 0}
              />
              <MetricCard 
                label="Avg Order Value" 
                value={`₹${(summary?.revenue?.summary?.avgOrderValue || 0).toFixed(2)}`}
              />
            </div>
          </ReportSection>

          {/* Users Summary */}
          <ReportSection
            title="User Growth"
            icon={Users}
            color="blue"
            exportAction={() => handleExport('users')}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard 
                label="New Users" 
                value={summary?.users?.summary?.totalNewUsers || 0}
                color="text-blue-600"
              />
              {summary?.users?.statusBreakdown?.map((status: any) => (
                <MetricCard 
                  key={status._id}
                  label={`${status._id.charAt(0).toUpperCase() + status._id.slice(1)} Users`}
                  value={status.count}
                />
              ))}
            </div>
          </ReportSection>

          {/* Orders Summary */}
          <ReportSection
            title="Orders Overview"
            icon={ShoppingCart}
            color="purple"
            exportAction={() => handleExport('orders')}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard 
                label="Total Orders" 
                value={summary?.orders?.totalOrders || 0}
                color="text-purple-600"
              />
              <MetricCard 
                label="Completed" 
                value={summary?.orders?.completedOrders || 0}
                color="text-green-600"
              />
              <MetricCard 
                label="Cancelled" 
                value={summary?.orders?.cancelledOrders || 0}
                color="text-red-600"
              />
              <MetricCard 
                label="Completion Rate" 
                value={`${summary?.orders?.completionRate || 0}%`}
              />
            </div>
          </ReportSection>

          {/* Top Astrologers */}
          <ReportSection
            title="Top Performing Astrologers"
            icon={TrendingUp}
            color="indigo"
            exportAction={() => handleExport('astrologers')}
          >
            {summary?.astrologers && summary.astrologers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Minutes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.astrologers.map((astro: any, idx: number) => (
                      <tr key={astro._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900">#{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{astro.name}</p>
                          <p className="text-xs text-gray-500">{astro.phoneNumber}</p>
                        </td>
                        <td className="px-4 py-3 font-bold text-green-600">₹{astro.totalRevenue.toLocaleString()}</td>
                        <td className="px-4 py-3">{astro.totalOrders}</td>
                        <td className="px-4 py-3">{astro.totalMinutes || 0} min</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1">
                            ⭐ {(astro.avgRating || 0).toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </ReportSection>

          {/* Payments Summary */}
          <ReportSection
            title="Payments Breakdown"
            icon={BarChart3}
            color="orange"
          >
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard 
                label="Recharges" 
                value={`₹${(summary?.payments?.recharges?.total || 0).toLocaleString()}`}
                subtitle={`${summary?.payments?.recharges?.count || 0} transactions`}
                color="text-green-600"
              />
              <MetricCard 
                label="Deductions" 
                value={`₹${(summary?.payments?.deductions?.total || 0).toLocaleString()}`}
                subtitle={`${summary?.payments?.deductions?.count || 0} transactions`}
                color="text-red-600"
              />
              <MetricCard 
                label="Refunds" 
                value={`₹${(summary?.payments?.refunds?.total || 0).toLocaleString()}`}
                subtitle={`${summary?.payments?.refunds?.count || 0} transactions`}
                color="text-blue-600"
              />
              <MetricCard 
                label="Bonuses" 
                value={`₹${(summary?.payments?.bonuses?.total || 0).toLocaleString()}`}
                subtitle={`${summary?.payments?.bonuses?.count || 0} transactions`}
                color="text-purple-600"
              />
              <MetricCard 
                label="Gift Cards" 
                value={`₹${(summary?.payments?.giftcards?.total || 0).toLocaleString()}`}
                subtitle={`${summary?.payments?.giftcards?.count || 0} redeemed`}
                color="text-yellow-600"
              />
            </div>
          </ReportSection>
        </>
      )}
    </div>
  );
}

function ReportSection({ title, icon: Icon, color, children, exportAction }: any) {
  const colors: Record<string, string> = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    indigo: 'text-indigo-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Icon size={20} className={colors[color]} />
          {title}
        </h3>
        {exportAction && (
          <button
            onClick={exportAction}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download size={16} />
            Export CSV
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function MetricCard({ label, value, subtitle, color = 'text-gray-900' }: any) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
