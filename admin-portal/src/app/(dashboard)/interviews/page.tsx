'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { Phone, Video, Users, Eye } from 'lucide-react';
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
        status: roundFilter || undefined, // Filter by interview round
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
          <p className="text-xs text-gray-500">{reg.ticketNumber}</p>
        </div>
      )
    },
    {
      header: 'Contact',
      cell: (reg) => (
        <div className="text-sm text-gray-600">
          <p>{reg.phoneNumber}</p>
          <p>{reg.email}</p>
        </div>
      )
    },
    {
      header: 'Current Round',
      cell: (reg) => {
        // Extract round number from status (e.g., "interview_round_1")
        const round = reg.status.includes('round_') ? reg.status.split('round_')[1] : '1';
        const icons: any = { '1': Phone, '2': Video, '3': Users, '4': Video };
        const Icon = icons[round] || Phone;
        
        return (
          <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium w-fit">
            <Icon size={14} />
            Round {round}
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
            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-900 font-medium text-sm"
          >
            <Eye size={16} />
            Conduct
          </Link>
        </div>
      )
    }
  ];

  if (!can('view_interviews')) return <div className="p-12 text-center">Access Denied</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interviews</h1>
        <p className="text-gray-600 mt-1">Screening and assessment pipeline</p>
      </div>

      <FilterBar 
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search candidates..."
        }}
        filters={[
          {
            value: roundFilter,
            onChange: setRoundFilter,
            options: [
              { label: 'Round 1 (Phone)', value: 'interview_round_1' },
              { label: 'Round 2 (Video)', value: 'interview_round_2' },
              { label: 'Round 3 (Panel)', value: 'interview_round_3' },
              { label: 'Round 4 (Final)', value: 'interview_round_4' },
            ],
            placeholder: "All Rounds"
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
