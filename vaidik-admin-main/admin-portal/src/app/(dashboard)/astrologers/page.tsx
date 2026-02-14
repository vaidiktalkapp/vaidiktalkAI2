'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { Eye, Star, Award, AlertCircle } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

interface Astrologer {
  _id: string;
  name: string;
  phoneNumber: string;
  email: string;
  profilePicture?: string;
  specializations: string[];
  accountStatus: string;
  ratings: { average: number; total: number };
}

export default function AstrologersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['astrologers', page, search, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getAllAstrologers({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
      });
      return response.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['astrologer-stats'],
    queryFn: async () => {
      const response = await adminApi.getRegistrationStats(); // Reusing reg stats for waitlist count
      return response.data.data;
    },
  });

  const columns: Column<Astrologer>[] = [
    {
      header: 'Astrologer',
      cell: (astro) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 overflow-hidden flex items-center justify-center shrink-0">
            {astro.profilePicture ? (
              <img src={astro.profilePicture} alt={astro.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-purple-700 font-bold">{astro.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{astro.name}</p>
            <div className="flex items-center gap-1 text-xs text-yellow-600">
              <Star size={10} fill="currentColor" />
              <span>{astro.ratings?.average?.toFixed(1) || 'New'}</span>
              <span className="text-gray-400">({astro.ratings?.total || 0})</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      cell: (astro) => (
        <div className="text-sm">
          <p className="text-gray-900">{astro.phoneNumber}</p>
          <p className="text-xs text-gray-500">{astro.email}</p>
        </div>
      )
    },
    {
      header: 'Specializations',
      cell: (astro) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {astro.specializations?.slice(0, 2).map(spec => (
            <span key={spec} className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">
              {spec}
            </span>
          ))}
          {astro.specializations?.length > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded">
              +{astro.specializations.length - 2}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      cell: (astro) => {
        const statusMap: Record<string, string> = {
          active: 'bg-green-100 text-green-800',
          suspended: 'bg-red-100 text-red-800',
          inactive: 'bg-gray-100 text-gray-800',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusMap[astro.accountStatus] || 'bg-gray-100'}`}>
            {astro.accountStatus}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      className: 'text-right',
      cell: (astro) => (
        <div className="flex justify-end">
          <Link href={`/astrologers/${astro._id}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
            <Eye size={18} />
          </Link>
        </div>
      )
    }
  ];

  if (!can('view_astrologers')) return <div className="p-12 text-center">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Astrologers</h1>
          <p className="text-gray-600 mt-1">Manage profiles and performance</p>
        </div>
        
        {/* Pending Action Button */}
        <Link href="/astrologers/pending" className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors">
          <AlertCircle size={18} />
          <span className="font-medium">Waitlist ({stats?.waitlist || 0})</span>
        </Link>
      </div>

      <FilterBar 
        search={{
          value: search,
          onChange: (val) => { setSearch(val); setPage(1); },
          placeholder: "Search astrologers..."
        }}
        filters={[
          {
            value: statusFilter,
            onChange: (val) => { setStatusFilter(val); setPage(1); },
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Suspended', value: 'suspended' },
              { label: 'Inactive', value: 'inactive' }
            ],
            placeholder: "All Status"
          }
        ]}
        onReset={() => { setSearch(''); setStatusFilter(''); setPage(1); }}
      />

      <DataTable
        data={data?.astrologers || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page,
          totalPages: data?.pagination?.pages || 1,
          onPageChange: setPage
        }}
      />
    </div>
  );
}
