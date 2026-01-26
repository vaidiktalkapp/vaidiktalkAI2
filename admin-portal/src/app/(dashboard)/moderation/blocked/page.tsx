'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { BlockedEntity } from '@/types/moderation';
import { Search, Unlock, Ban, User, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function BlockedListPage() {
  // Toggle between 'users' and 'astrologers'
  const [viewMode, setViewMode] = useState<'users' | 'astrologers'>('users');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: blockedEntities, isLoading } = useQuery({
    queryKey: ['blocked-list', viewMode, search],
    queryFn: async () => {
      if (viewMode === 'users') {
        const res = await adminApi.getBlockedUsers({ search, limit: 50 });
        // FIX: Handle response structure { users: [...] }
        const list = res.data?.users || res.data?.data || [];
        return list.map((u: any) => ({ ...u, role: 'user' })) as BlockedEntity[];
      } else {
        const res = await adminApi.getBlockedAstrologers({ search, limit: 50 });
        // FIX: Handle response structure { astrologers: [...] }
        const list = res.data?.astrologers || res.data?.data || [];
        return list.map((a: any) => ({ ...a, role: 'astrologer' })) as BlockedEntity[];
      }
    }
  });

  const unblockMutation = useMutation({
    mutationFn: async (entity: BlockedEntity) => {
      if (entity.role === 'user') {
        return adminApi.updateUserStatus(entity._id, 'active');
      } else {
        return adminApi.updateAstrologerStatus(entity._id, 'active');
      }
    },
    onSuccess: () => {
      toast.success('Unblocked successfully');
      queryClient.invalidateQueries({ queryKey: ['blocked-list'] });
    }
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ban className="text-red-600" /> Blocked List
          </h1>
          <p className="text-gray-500">Manage banned accounts.</p>
        </div>

        <div className="flex gap-2">
          <div className="flex bg-gray-100 p-1 rounded-lg h-10">
            <button
              onClick={() => setViewMode('users')}
              className={`px-4 flex items-center gap-2 text-sm font-medium rounded-md ${
                viewMode === 'users' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
              }`}
            >
              <User size={14} /> Users
            </button>
            <button
              onClick={() => setViewMode('astrologers')}
              className={`px-4 flex items-center gap-2 text-sm font-medium rounded-md ${
                viewMode === 'astrologers' ? 'bg-white shadow text-purple-600' : 'text-gray-500'
              }`}
            >
              <Star size={14} /> Astrologers
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm h-10 w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-red-50/30 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Blocked Reason</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={4} className="p-8 text-center">Loading...</td></tr>
            ) : blockedEntities?.map((entity) => (
              <tr key={entity._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{entity.name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs text-gray-500">
                    <span>{entity.phone}</span>
                    <span>{entity.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-red-600 italic">
                  {entity.blockedReason || 'Violation of Terms'}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => {
                      if(confirm(`Unblock ${entity.name}?`)) unblockMutation.mutate(entity);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors text-xs font-medium"
                  >
                    <Unlock size={12} /> Unblock
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}