// app/(dashboard)/reports/page.tsx
'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Download, Calendar, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.generateReport({
        type: reportType,
        startDate,
        endDate,
        format,
      });
      return response;
    },
    onSuccess: (response) => {
      // Trigger download
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}-${new Date().toISOString()}.${format}`;
      a.click();
      toast.success('Report downloaded successfully');
    },
    onError: () => {
      toast.error('Failed to generate report');
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Exports</h1>
        <p className="text-gray-600 mt-1">Generate comprehensive reports</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="revenue">Revenue Report</option>
              <option value="users">User Activity Report</option>
              <option value="astrologers">Astrologer Performance</option>
              <option value="orders">Orders Summary</option>
              <option value="remedies">Remedies Conversion</option>
              <option value="streams">Livestream Analytics</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex gap-2">
              {(['csv', 'xlsx', 'pdf'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    format === fmt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={() => generateReportMutation.mutate()}
          disabled={generateReportMutation.isPending || !startDate || !endDate}
          className="mt-6 w-full flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {generateReportMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Download size={20} className="mr-2" />
              Generate & Download Report
            </>
          )}
        </button>
      </div>

      {/* Quick Reports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <FileSpreadsheet className="text-blue-600 mb-2" size={32} />
          <h4 className="font-semibold text-gray-900">Today's Summary</h4>
          <p className="text-sm text-gray-600 mt-1">All activity from today</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <Calendar className="text-green-600 mb-2" size={32} />
          <h4 className="font-semibold text-gray-900">This Month</h4>
          <p className="text-sm text-gray-600 mt-1">Monthly performance report</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer">
          <TrendingUp className="text-purple-600 mb-2" size={32} />
          <h4 className="font-semibold text-gray-900">Quarterly Report</h4>
          <p className="text-sm text-gray-600 mt-1">Last 3 months analysis</p>
        </div>
      </div>
    </div>
  );
}
