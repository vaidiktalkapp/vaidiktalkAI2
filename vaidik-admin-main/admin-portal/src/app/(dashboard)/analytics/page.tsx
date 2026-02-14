'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { 
  Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart 
} from 'recharts';
import { Calendar, Loader2, AlertCircle, TrendingUp, TrendingDown, IndianRupee, Layers } from 'lucide-react';
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
          <p className="text-gray-600 mt-1">Revenue breakdown and performance metrics</p>
        </div>
        
        {/* Date Filter */}
        <div className="flex items-center bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center px-3 border-r border-gray-100">
            <Calendar className="text-gray-400 mr-2" size={16} />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Range</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-sm border-none focus:ring-0 text-gray-700 bg-transparent"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-sm border-none focus:ring-0 text-gray-700 bg-transparent"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard 
          label="Gross Commission" 
          value={periodStats.gross} 
          subtext="Platform Share (40%)"
          color="text-indigo-600"
          icon={IndianRupee}
        />
        <SummaryCard 
          label="Bonus Expenses" 
          value={periodStats.deductions} 
          subtext="Promotional Credits Used"
          color="text-red-500"
          icon={TrendingDown}
        />
        <SummaryCard 
          label="Net Profit" 
          value={periodStats.net} 
          subtext="Gross - Bonuses"
          color={periodStats.net >= 0 ? "text-emerald-600" : "text-red-600"}
          icon={TrendingUp}
          highlight
        />
        <SummaryCard 
          label="Volume" 
          value={periodStats.orders} 
          subtext="Sessions Completed"
          color="text-gray-800"
          icon={Layers}
          isCurrency={false}
        />
      </div>

      {/* Main Chart: Revenue & Volume */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Revenue & Volume Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[450px] p-6">
          {revenueLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 12, fill: '#6b7280'}} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{fontSize: 12, fill: '#6b7280'}} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{fontSize: 12, fill: '#9ca3af'}} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
                />
                <Legend iconType="circle" />
                
                {/* Gross Revenue Area */}
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="gross" 
                  name="Gross Revenue" 
                  fill="url(#colorGross)" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                />
                
                {/* Bonus Deductions Bar - Stacked look */}
                <Bar 
                  yAxisId="left"
                  dataKey="deductions" 
                  name="Bonus Deductions" 
                  fill="#fca5a5" 
                  radius={[4, 4, 0, 0]} 
                  barSize={15}
                  opacity={0.8}
                />
                
                {/* Net Profit Line */}
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="net" 
                  name="Net Profit" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{r: 6}}
                />

                {/* Order Volume Line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="orders"
                  name="Order Count"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 bg-gray-50 rounded-lg">
              <AlertCircle className="h-10 w-10 text-gray-400 mb-2" />
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
    <Card className={`transition-all hover:shadow-md ${highlight ? 'border-l-4 border-l-emerald-500' : ''}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-2 ${color}`}>
              {isCurrency ? `₹${(value || 0).toLocaleString()}` : (value || 0).toLocaleString()}
            </p>
            {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl bg-gray-50 ${color.replace('text-', 'bg-opacity-10 text-opacity-80 bg-')}`}>
              <Icon size={22} className={color} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}