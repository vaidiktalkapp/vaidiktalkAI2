'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Search, UserPlus, Shield, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminsPage() {
  const [search, setSearch] = useState('');

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admins', search],
    queryFn: async () => {
      // This endpoint needs to be created in backend
      const response = await apiClient.get('/admin/admins', {
        params: { search },
      });
      return response.data.data;
    },
  });

  const getRoleColor = (roleType: string) => {
    switch (roleType) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'moderator': return 'bg-purple-100 text-purple-800';
      case 'support': return 'bg-green-100 text-green-800';
      case 'analyst': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-1">Manage admin users and permissions</p>
        </div>
        <Link
          href="/admins/create"
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <UserPlus size={18} className="mr-2" />
          Create Admin
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Admins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          admins?.admins?.map((admin: any) => (
            <div key={admin._id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-lg">
                      {admin.name?.charAt(0) || 'A'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                  </div>
                </div>
                {admin.isSuperAdmin && (
                  <Shield className="text-red-500" size={20} />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(admin.roleType)}`}>
                    {admin.roleType}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    admin.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.status}
                  </span>
                </div>

                {admin.lastLoginAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Login:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(admin.lastLoginAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Department:</span>
                  <span className="text-sm text-gray-900">{admin.department || 'N/A'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center text-sm text-gray-500">
                <Activity size={14} className="mr-1" />
                Created {new Date(admin.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
