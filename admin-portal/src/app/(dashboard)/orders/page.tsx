// src/app/(dashboard)/orders/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';

// Demo data for development/testing
const DEMO_STATS = {
  total: 156,
  completed: 98,
  cancelled: 12,
  totalRevenue: 245600,
};

const DEMO_ORDERS = {
  orders: [
    {
      _id: 'demo-1',
      orderId: 'ORD-2024-10001',
      userId: {
        name: 'Rahul Kumar',
        phoneNumber: '+919876543210',
      },
      astrologerId: {
        name: 'Pandit Sharma',
      },
      type: 'chat',
      totalAmount: 299,
      status: 'completed',
      createdAt: new Date('2024-10-28T10:30:00'),
    },
    {
      _id: 'demo-2',
      orderId: 'ORD-2024-10002',
      userId: {
        name: 'Priya Singh',
        phoneNumber: '+919876543211',
      },
      astrologerId: {
        name: 'Astrologer Gupta',
      },
      type: 'call',
      totalAmount: 599,
      status: 'ongoing',
      createdAt: new Date('2024-10-28T11:15:00'),
    },
    {
      _id: 'demo-3',
      orderId: 'ORD-2024-10003',
      userId: {
        name: 'Amit Verma',
        phoneNumber: '+919876543212',
      },
      astrologerId: {
        name: 'Dr. Acharya',
      },
      type: 'video_call',
      totalAmount: 899,
      status: 'pending',
      createdAt: new Date('2024-10-28T09:45:00'),
    },
    {
      _id: 'demo-4',
      orderId: 'ORD-2024-10004',
      userId: {
        name: 'Sneha Patel',
        phoneNumber: '+919876543213',
      },
      astrologerId: {
        name: 'Pandit Mishra',
      },
      type: 'chat',
      totalAmount: 199,
      status: 'completed',
      createdAt: new Date('2024-10-27T16:20:00'),
    },
    {
      _id: 'demo-5',
      orderId: 'ORD-2024-10005',
      userId: {
        name: 'Rajesh Mehta',
        phoneNumber: '+919876543214',
      },
      astrologerId: {
        name: 'Astrologer Pandey',
      },
      type: 'call',
      totalAmount: 499,
      status: 'cancelled',
      createdAt: new Date('2024-10-27T14:10:00'),
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 5,
    pages: 1,
  },
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter, typeFilter, startDate, endDate],
    queryFn: async () => {
      const response = await adminApi.getAllOrders({
        page,
        limit: 20,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      return response.data.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const response = await adminApi.getOrderDetails('stats');
      return response.data.data;
    },
  });

  // Use demo data if API returns empty or undefined
  const orders = ordersData && ordersData.orders?.length > 0 ? ordersData : DEMO_ORDERS;
  const stats = statsData || DEMO_STATS;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'ongoing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'chat': return 'bg-purple-100 text-purple-800';
      case 'call': return 'bg-blue-100 text-blue-800';
      case 'video_call': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600 mt-1">View and manage all consultation orders</p>
        {(!ordersData || ordersData.orders?.length === 0) && (
          <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-md inline-block">
            📊 Showing demo data (API not connected)
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-600">{stats?.cancelled || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Revenue</p>
          <p className="text-2xl font-bold text-blue-600">
            ₹{(stats?.totalRevenue || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="chat">Chat</option>
            <option value="call">Audio Call</option>
            <option value="video_call">Video Call</option>
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="End Date"
          />

          <button
            onClick={() => {
              setStatusFilter('');
              setTypeFilter('');
              setStartDate('');
              setEndDate('');
            }}
            className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <RefreshCw size={18} className="mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Astrologer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders?.orders?.map((order: any) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.userId?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.userId?.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.astrologerId?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeColor(order.type)}`}>
                          {order.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{order.totalAmount?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/orders/${order._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye size={18} className="inline" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {(!orders?.orders || orders.orders.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders found</p>
              </div>
            )}

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= (orders?.pagination?.pages || 1)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{orders?.pagination?.pages || 1}</span>
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
                      disabled={page >= (orders?.pagination?.pages || 1)}
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
