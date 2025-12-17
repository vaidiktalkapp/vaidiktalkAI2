'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { 
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart 
} from 'recharts';
import { Calendar, Loader2, AlertCircle, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch Detailed Revenue Analytics
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue-analytics', startDate, endDate],
    queryFn: async () => {
      const response = await adminApi.getRevenueAnalytics(startDate, endDate);
      return response.data.data;
    },
  });

  // Calculate Aggregates for the selected period
  const periodStats = revenueData?.reduce((acc: any, curr: any) => ({
    gross: (acc.gross || 0) + curr.gross,
    deductions: (acc.deductions || 0) + curr.deductions,
    net: (acc.net || 0) + curr.net,
    orders: (acc.orders || 0) + curr.orders
  }), { gross: 0, deductions: 0, net: 0, orders: 0 }) || {};

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
          <p className="text-gray-600 mt-1">Detailed breakdown of platform revenue and expenses</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <Calendar className="text-gray-400 ml-2" size={18} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-sm border-none focus:ring-0 text-gray-700"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-sm border-none focus:ring-0 text-gray-700"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          label="Gross Commission" 
          value={periodStats.gross} 
          subtext="Total platform share (40%)"
          color="text-indigo-600"
          icon={IndianRupee}
        />
        <SummaryCard 
          label="Bonus Deductions" 
          value={periodStats.deductions} 
          subtext="Cost of free credits used"
          color="text-red-600"
          icon={TrendingDown}
        />
        <SummaryCard 
          label="Net Revenue" 
          value={periodStats.net} 
          subtext="Gross - Deductions"
          color={periodStats.net >= 0 ? "text-green-600" : "text-red-600"}
          icon={TrendingUp}
          highlight
        />
        <SummaryCard 
          label="Total Orders" 
          value={periodStats.orders} 
          subtext="Completed sessions"
          color="text-gray-900"
          isCurrency={false}
        />
      </div>

      {/* Main Chart: Revenue Breakdown */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Revenue vs. Deductions</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          {revenueLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: '#6b7280'}} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                />
                <YAxis tick={{fontSize: 12, fill: '#6b7280'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                />
                <Legend />
                {/* Gross Revenue Area */}
                <Area 
                  type="monotone" 
                  dataKey="gross" 
                  name="Gross Commission" 
                  fill="#e0e7ff" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                />
                {/* Bonus Deductions Bar */}
                <Bar 
                  dataKey="deductions" 
                  name="Bonus Deductions" 
                  fill="#fca5a5" 
                  radius={[4, 4, 0, 0]} 
                  barSize={20}
                />
                {/* Net Revenue Line */}
                <Line 
                  type="monotone" 
                  dataKey="net" 
                  name="Net Profit" 
                  stroke="#16a34a" 
                  strokeWidth={3} 
                  dot={{r: 4, fill: '#16a34a'}} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="h-10 w-10 text-gray-300 mb-2" />
              <p>No financial data found for this period.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, subtext, color, icon: Icon, highlight, isCurrency = true }: any) {
  return (
    <Card className={`${highlight ? 'border-l-4 border-l-green-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-2 ${color}`}>
              {isCurrency ? `₹${(value || 0).toLocaleString()}` : (value || 0).toLocaleString()}
            </p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
          </div>
          {Icon && (
            <div className={`p-3 rounded-lg bg-gray-50 ${color.replace('text-', 'text-opacity-100 bg-opacity-10 bg-')}`}>
              <Icon size={24} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}