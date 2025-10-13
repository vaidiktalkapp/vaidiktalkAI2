'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateAdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    roleType: 'admin',
    department: '',
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: any) => apiClient.post('/admin/auth/create-admin', data),
    onSuccess: () => {
      toast.success('Admin created successfully');
      router.push('/admins');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create admin');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill all required fields');
      return;
    }

    createAdminMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Admin</h1>
          <p className="text-gray-600 mt-1">Add a new administrator to the platform</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="admin@astrotalk.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Min 8 characters"
              />
              <p className="text-xs text-gray-500 mt-1">
                Admin will be required to change password on first login
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="+91 9876543210"
              />
            </div>

            {/* Role Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role Type *
              </label>
              <select
                name="roleType"
                value={formData.roleType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="support">Support</option>
                <option value="analyst">Analyst</option>
                <option value="content_manager">Content Manager</option>
              </select>
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Operations, Support, etc."
              />
            </div>
          </div>

          {/* Permissions Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Role Permissions</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {formData.roleType === 'admin' && (
                <>
                  <p>• Full access to user and astrologer management</p>
                  <p>• Can approve/reject astrologers</p>
                  <p>• Access to financial reports</p>
                  <p>• Can process refunds and payouts</p>
                </>
              )}
              {formData.roleType === 'moderator' && (
                <>
                  <p>• Can moderate content and live streams</p>
                  <p>• Can block/unblock users</p>
                  <p>• Limited access to analytics</p>
                </>
              )}
              {formData.roleType === 'support' && (
                <>
                  <p>• Can view user details</p>
                  <p>• Can process refunds</p>
                  <p>• Access to support tickets</p>
                </>
              )}
              {formData.roleType === 'analyst' && (
                <>
                  <p>• Full access to analytics</p>
                  <p>• Can generate reports</p>
                  <p>• Read-only access to other modules</p>
                </>
              )}
              {formData.roleType === 'content_manager' && (
                <>
                  <p>• Can manage blog posts and content</p>
                  <p>• Can moderate reviews</p>
                  <p>• Limited administrative access</p>
                </>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createAdminMutation.isPending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
