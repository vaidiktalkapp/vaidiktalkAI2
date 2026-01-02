'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import { 
  Phone, Video, Users, Eye, CheckCircle, XCircle, Clock, UserCheck 
} from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const queryClient = useQueryClient();

  // 1. Fetch Interviews (Active Rounds)
  const interviewsQuery = useQuery({
    queryKey: ['interviews', page, search, statusFilter],
    queryFn: async () => {
      const response = await adminApi.getAllRegistrations({
        page,
        limit: 20,
        search,
        status: statusFilter || undefined,
      });
      return response.data.data;
    },
  });

  // 2. Fetch Waitlist (Initial Applications)
  const waitlistQuery = useQuery({
    queryKey: ['waitlist', page],
    queryFn: async () => {
      const response = await adminApi.getWaitlist({ page, limit: 20 });
      return response.data.data;
    },
    enabled: activeTab === 'waitlist',
  });

  // 3. Shortlist Mutation (Move from Waitlist to Round 1)
  const shortlistMutation = useMutation({
    mutationFn: (id: string) => adminApi.shortlistCandidate(id),
    onSuccess: () => {
      toast.success('Candidate moved to Interview Round 1');
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    }
  });

  const interviewColumns: Column<any>[] = [
    {
      header: 'Candidate',
      cell: (reg) => (
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
            {reg.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{reg.name}</p>
            <p className="text-xs text-gray-500 font-mono">{reg.ticketNumber}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Status / Round',
      cell: (reg) => {
        if (reg.status.includes('interview_round_')) {
          const round = reg.status.split('interview_round_')[1];
          const icons: any = { '1': Phone, '2': Video, '3': Users, '4': UserCheck };
          const Icon = icons[round] || Phone;
          return (
            <span className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium w-fit">
              <Icon size={14} /> Round {round}
            </span>
          );
        }
        return <span className="capitalize">{reg.status.replace(/_/g, ' ')}</span>;
      }
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (reg) => (
        <Link href={`/interviews/${reg._id}`} className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end gap-1">
          <Eye size={16} /> View & Assess
        </Link>
      )
    }
  ];

  const waitlistColumns: Column<any>[] = [
    {
      header: 'Applicant',
      cell: (reg) => (
        <div>
          <p className="font-medium text-gray-900">{reg.name}</p>
          <p className="text-xs text-gray-500">{reg.phoneNumber}</p>
        </div>
      )
    },
    {
      header: 'Applied Date',
      cell: (reg) => new Date(reg.createdAt).toLocaleDateString()
    },
    {
      header: 'Action',
      className: 'text-right',
      cell: (reg) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => shortlistMutation.mutate(reg._id)}
            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
          >
            Shortlist
          </button>
          <Link href={`/interviews/${reg._id}`} className="p-1 text-gray-400 hover:text-gray-600">
            <Eye size={18} />
          </Link>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Pipeline</h1>
          <p className="text-gray-600 mt-1">Manage waitlist and interview assessments</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">Active Interviews</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist (New Apps)</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <FilterBar 
            searchQuery={search}
            onSearchChange={setSearch}
            filters={[{
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { label: 'Round 1', value: 'interview_round_1' },
                { label: 'Round 2', value: 'interview_round_2' },
                { label: 'Round 3', value: 'interview_round_3' },
                { label: 'Round 4', value: 'interview_round_4' },
              ],
              placeholder: "All Rounds"
            }]}
            onReset={() => { setSearch(''); setStatusFilter(''); }}
          />
          <DataTable
            data={interviewsQuery.data?.registrations || []}
            columns={interviewColumns}
            isLoading={interviewsQuery.isLoading}
            pagination={{
              page,
              totalPages: interviewsQuery.data?.pagination?.pages || 1,
              onPageChange: setPage
            }}
          />
        </TabsContent>

        <TabsContent value="waitlist">
          <DataTable
            data={waitlistQuery.data?.registrations || []}
            columns={waitlistColumns}
            isLoading={waitlistQuery.isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}