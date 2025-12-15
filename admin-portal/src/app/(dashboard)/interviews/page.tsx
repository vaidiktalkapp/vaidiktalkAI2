'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { 
  Phone, 
  Video, 
  Users, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock 
} from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { usePermission } from '@/hooks/use-permission';

interface Registration {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: string;
  ticketNumber: string;
}

export default function InterviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roundFilter, setRoundFilter] = useState('');
  const { can } = usePermission();

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', page, search, roundFilter],
    queryFn: async () => {
      const response = await adminApi.getAllRegistrations({
        page,
        limit: 20,
        search,
        status: roundFilter || undefined,
      });
      return response.data.data;
    },
    enabled: can('view_interviews'),
  });

  const columns: Column<Registration>[] = [
    {
      header: 'Candidate',
      cell: (reg) => (
        <div>
          <p className="font-medium text-gray-900">{reg.name}</p>
          <p className="text-xs text-gray-500 font-mono">{reg.ticketNumber}</p>
        </div>
      )
    },
    {
      header: 'Contact',
      cell: (reg) => (
        <div className="text-sm text-gray-600">
          <p>{reg.phoneNumber}</p>
          <p className="text-xs text-gray-500">{reg.email}</p>
        </div>
      )
    },
    {
      header: 'Status / Round',
      cell: (reg) => {
        // 1. Handle Completed/Approved
        if (reg.status === 'completed' || reg.status === 'approved') {
          return (
            <span className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium w-fit">
              <CheckCircle size={14} />
              Completed
            </span>
          );
        }

        // 2. Handle Rejected
        if (reg.status === 'rejected') {
          return (
            <span className="flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium w-fit">
              <XCircle size={14} />
              Rejected
            </span>
          );
        }

        // 3. Handle Active Interview Rounds
        if (reg.status.includes('interview_round_')) {
          const round = reg.status.split('interview_round_')[1];
          const icons: any = { '1': Phone, '2': Video, '3': Users, '4': Video };
          const Icon = icons[round] || Phone;
          
          return (
            <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium w-fit">
              <Icon size={14} />
              Round {round}
            </span>
          );
        }

        // 4. Fallback (Waitlist, Pending, etc.)
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium w-fit capitalize">
            <Clock size={14} />
            {reg.status.replace(/_/g, ' ')}
          </span>
        );
      }
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (reg) => (
        <div className="flex justify-end">
          <Link 
            href={`/interviews/${reg._id}`}
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-medium text-sm transition-colors"
          >
            <Eye size={16} />
            View
          </Link>
        </div>
      )
    }
  ];

  if (!can('view_interviews')) return <div className="p-12 text-center text-gray-500">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
        <p className="text-gray-600 mt-1">Screening and assessment pipeline</p>
      </div>

      <FilterBar 
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search candidates..."
        filters={[
          {
            value: roundFilter,
            onChange: setRoundFilter,
            options: [
              { label: 'Round 1 (Phone)', value: 'interview_round_1' },
              { label: 'Round 2 (Video)', value: 'interview_round_2' },
              { label: 'Round 3 (Panel)', value: 'interview_round_3' },
              { label: 'Round 4 (Final)', value: 'interview_round_4' },
              { label: 'Completed', value: 'completed' },
              { label: 'Rejected', value: 'rejected' },
            ],
            placeholder: "All Statuses"
          }
        ]}
        onReset={() => { setSearch(''); setRoundFilter(''); }}
      />

      <DataTable
        data={data?.registrations || []}
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