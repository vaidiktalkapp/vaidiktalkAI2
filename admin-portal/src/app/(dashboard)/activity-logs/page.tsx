'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Filter, Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity-logs', page, moduleFilter, actionFilter],
    queryFn: async () => {
      // This endpoint needs to be created in backend
      const response = await apiClient.get('/admin/activity-logs', {
        params: {
          page,
          limit: 20,
          module: moduleFilter || undefined,
          action: actionFilter || undefined,
        },
      });
      return response.data.data;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <Activity className="text-gray-500" size={20} />;
    }
  };

  const getModuleColor = (module: string) => {
    const colors: { [key: string]: string } = {
      users: 'bg-blue-100 text-blue-800',
      astrologers: 'bg-purple-100 text-purple-800',
      orders: 'bg-green-100 text-green-800',
      payments: 'bg-yellow-100 text-yellow-800',
      auth: 'bg-red-100 text-red-800',
      admins: 'bg-indigo-100 text-indigo-800',
    };
    return colors[module] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600 mt-1">Track all administrative actions and system events</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Modules</option>
            <option value="users">Users</option>
            <option value="astrologers">Astrologers</option>
            <option value="orders">Orders</option>
            <option value="payments">Payments</option>
            <option value="auth">Authentication</option>
            <option value="admins">Admins</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="login">Login</option>
          </select>

          <button
            onClick={() => {
              setModuleFilter('');
              setActionFilter('');
            }}
            className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <Filter size={18} className="mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activity Log Timeline */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {logs?.logs?.map((log: any) => (
                <div key={log._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {getStatusIcon(log.status)}
                    </div>

                    {/* Log Content */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getModuleColor(log.module)}`}>
                            {log.module}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {log.action}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          Admin: <span className="font-medium text-gray-900">{log.adminId?.name || 'System'}</span>
                        </p>

                        {log.targetType && log.targetId && (
                          <p className="text-sm text-gray-600">
                            Target: <span className="font-medium text-gray-900">{log.targetType} ({log.targetId})</span>
                          </p>
                        )}

                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs font-medium text-gray-700 mb-1">Details:</p>
                            <pre className="text-xs text-gray-600 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}

                        {log.changes && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs font-medium text-blue-700 mb-1">Changes:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="font-medium text-gray-700">Before:</p>
                                <pre className="text-gray-600">
                                  {JSON.stringify(log.changes.before, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <p className="font-medium text-gray-700">After:</p>
                                <pre className="text-gray-600">
                                  {JSON.stringify(log.changes.after, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}

                        {log.ipAddress && (
                          <p className="text-xs text-gray-500">
                            IP: {log.ipAddress}
                          </p>
                        )}

                        {log.errorMessage && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-800">{log.errorMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{logs?.pagination?.pages || 1}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= logs?.pagination?.pages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
