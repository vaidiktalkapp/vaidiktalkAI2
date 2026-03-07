'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { usePermission } from '@/hooks/use-permission';
import {
  TrendingUp, Users, Coins, ShoppingCart,
  Download, Calendar, BarChart3, ArrowRight, Wallet
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { can } = usePermission();

  // Default to last 30 days
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch Summary Data
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

      const exportPromise = (async () => {
        switch (type) {
          case 'revenue': return adminApi.exportRevenueReport(start, end);
          case 'users': return adminApi.exportUsersReport();
          case 'astrologers': return adminApi.exportAstrologersReport();
          case 'orders': return adminApi.exportOrdersReport(start, end);
          default: throw new Error('Invalid report type');
        }
      })();

      toast.promise(exportPromise, {
        loading: 'Generating report...',
        success: (res) => {
          // Create download link
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          return 'Report downloaded successfully';
        },
        error: 'Failed to generate report'
      });

    } catch (error: any) {
      console.error(error);
    }
  };

  if (!can('view_reports')) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500">
        <div className="bg-gray-100 p-4 rounded-full mb-4"><BarChart3 size={32} /></div>
        <h2 className="text-lg font-semibold text-gray-900">Access Denied</h2>
        <p>You do not have permission to view reports.</p>
      </div>
    );
  }

  // Prepare Chart Data
  const revenueChartData = summary?.revenue?.revenueData?.map((d: any) => ({
    date: `${d._id.day}/${d._id.month}`,
    amount: d.totalRevenue
  })) || [];

  const userChartData = summary?.users?.growthData?.map((d: any) => ({
    date: `${d._id.day}/${d._id.month}`,
    users: d.newUsers
  })) || [];

  return (
    <div className="space-y-8 p-6 max-w-[1600px] mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 mt-2 text-sm">Generate insights and export data for offline analysis (1 Credit = 1 ₹).</p>
        </div>

        {/* Date Filter */}
        <div className="bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
          <div className="flex items-center px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
            <Calendar className="text-gray-500 mr-2" size={16} />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-2">Period</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-none p-0 text-sm text-gray-700 focus:ring-0 cursor-pointer"
            />
            <span className="text-gray-400 mx-2">→</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-none p-0 text-sm text-gray-700 focus:ring-0 cursor-pointer"
            />
          </div>

          <div className="h-6 w-px bg-gray-200 mx-1" />

          <button
            onClick={() => {
              setStartDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white h-64 rounded-xl shadow-sm border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* 1. REVENUE REPORT */}
          <ReportCard
            title="Revenue Overview (1 Cr = 1 ₹)"
            icon={Coins}
            color="emerald"
            onExport={() => handleExport('revenue')}
          >
            <div className="grid grid-cols-3 gap-4 mb-6">
              <MetricItem
                label="Total Revenue"
                value={`${(summary?.revenue?.summary?.totalRevenue || 0).toLocaleString()} Cr`}
                trend="up"
              />
              <MetricItem
                label="Total Orders"
                value={summary?.revenue?.summary?.totalOrders || 0}
              />
              <MetricItem
                label="Avg Order Value"
                value={`${(summary?.revenue?.summary?.avgOrderValue || 0).toFixed(0)} Cr`}
              />
            </div>

            {/* Revenue Area Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(val: number) => [`${val} Cr`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ReportCard>

          {/* 2. USER GROWTH REPORT */}
          <ReportCard
            title="User Growth"
            icon={Users}
            color="blue"
            onExport={() => handleExport('users')}
          >
            <div className="flex items-start justify-between mb-6">
              <MetricItem
                label="New Users"
                value={summary?.users?.summary?.totalNewUsers || 0}
                highlight
                color="text-blue-600"
              />
              <div className="flex gap-2">
                {summary?.users?.statusBreakdown?.slice(0, 3).map((status: any) => (
                  <div key={status._id} className="px-3 py-1.5 bg-gray-50 rounded-lg text-center border border-gray-100">
                    <div className="text-xs text-gray-500 capitalize">{status._id}</div>
                    <div className="font-bold text-gray-800">{status.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Users Bar Chart */}
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userChartData}>
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ReportCard>

          {/* 3. ORDER STATISTICS */}
          <ReportCard
            title="Order Statistics"
            icon={ShoppingCart}
            color="violet"
            onExport={() => handleExport('orders')}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
              <div className="p-4 rounded-xl bg-violet-50 text-violet-900">
                <div className="text-sm font-medium opacity-80">Total</div>
                <div className="text-2xl font-bold">{summary?.orders?.totalOrders || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 text-green-900">
                <div className="text-sm font-medium opacity-80">Completed</div>
                <div className="text-2xl font-bold">{summary?.orders?.completedOrders || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 text-red-900">
                <div className="text-sm font-medium opacity-80">Cancelled</div>
                <div className="text-2xl font-bold">{summary?.orders?.cancelledOrders || 0}</div>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 text-gray-900">
                <div className="text-sm font-medium opacity-80">Success Rate</div>
                <div className="text-2xl font-bold">{summary?.orders?.completionRate || 0}%</div>
              </div>
            </div>

            {/* Order Type Breakdown */}
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Order Types</h4>
              <div className="space-y-3">
                {summary?.orders?.ordersByType?.map((type: any) => (
                  <div key={type._id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${type._id === 'chat' ? 'bg-blue-400' : 'bg-pink-400'}`} />
                      <span className="text-sm font-medium text-gray-700 capitalize">{type._id?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${type._id === 'chat' ? 'bg-blue-400' : 'bg-pink-400'}`}
                          style={{ width: `${(type.count / (summary?.orders?.totalOrders || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-12 text-right">{type.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ReportCard>

          {/* 4. TOP PERFORMERS TABLE */}
          <ReportCard
            title="Top Astrologers"
            icon={TrendingUp}
            color="orange"
            onExport={() => handleExport('astrologers')}
          >
            <div className="overflow-x-auto -mx-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3 w-16">Rank</th>
                    <th className="px-6 py-3">Astrologer</th>
                    <th className="px-6 py-3 text-right">Revenue</th>
                    <th className="px-6 py-3 text-right">Orders</th>
                    <th className="px-6 py-3 text-center">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {summary?.astrologers?.slice(0, 5).map((astro: any, idx: number) => (
                    <tr key={astro._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-400">#{idx + 1}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{astro.name}</div>
                        <div className="text-xs text-gray-500">{astro.phoneNumber}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-emerald-600">
                        {astro.totalRevenue.toLocaleString()} Cr
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        {astro.totalOrders}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-xs font-bold">
                          ★ {(astro.avgRating || 0).toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(!summary?.astrologers || summary.astrologers.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">
                        No performance data available for this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ReportCard>

          {/* 5. PAYMENTS OVERVIEW (Full Width) */}
          <div className="xl:col-span-2">
            <ReportCard
              title="Financial Transactions (1 Cr = 1 ₹)"
              icon={Wallet}
              color="indigo"
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <PaymentMetric
                  label="Recharges"
                  amount={summary?.payments?.recharges?.total}
                  count={summary?.payments?.recharges?.count}
                  color="text-emerald-600"
                  bgColor="bg-emerald-50"
                />
                <PaymentMetric
                  label="Usage (Deductions)"
                  amount={summary?.payments?.deductions?.total}
                  count={summary?.payments?.deductions?.count}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                />
                <PaymentMetric
                  label="Refunds"
                  amount={summary?.payments?.refunds?.total}
                  count={summary?.payments?.refunds?.count}
                  color="text-red-600"
                  bgColor="bg-red-50"
                />
                <PaymentMetric
                  label="Bonuses"
                  amount={summary?.payments?.bonuses?.total}
                  count={summary?.payments?.bonuses?.count}
                  color="text-purple-600"
                  bgColor="bg-purple-50"
                />
                <PaymentMetric
                  label="Gift Cards"
                  amount={summary?.payments?.giftcards?.total}
                  count={summary?.payments?.giftcards?.count}
                  color="text-amber-600"
                  bgColor="bg-amber-50"
                />
              </div>
            </ReportCard>
          </div>

        </div>
      )}
    </div>
  );
}

// --- SUB COMPONENTS ---

function ReportCard({ title, icon: Icon, color, children, onExport }: any) {
  const colorMap: any = {
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    violet: 'text-violet-600 bg-violet-50',
    orange: 'text-orange-600 bg-orange-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>
            <Icon size={20} />
          </div>
          <h3 className="font-bold text-gray-800">{title}</h3>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>
      <div className="p-6 flex-1">
        {children}
      </div>
    </div>
  );
}

function MetricItem({ label, value, highlight, color = 'text-gray-900', trend }: any) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {trend === 'up' && <TrendingUp size={16} className="text-emerald-500" />}
      </div>
    </div>
  );
}

function PaymentMetric({ label, amount, count, color, bgColor }: any) {
  return (
    <div className={`p-4 rounded-xl ${bgColor} border border-transparent hover:border-gray-200 transition-all`}>
      <p className="text-xs font-semibold opacity-70 uppercase mb-2 text-gray-800">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{(amount || 0).toLocaleString()} Cr</p>
      <p className="text-xs mt-1 text-gray-600 font-medium">{count || 0} txns</p>
    </div>
  );
}