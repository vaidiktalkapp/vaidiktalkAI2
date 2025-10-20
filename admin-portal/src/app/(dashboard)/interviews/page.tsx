'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Search, Filter, Eye, Phone, Video, Users } from 'lucide-react';
import Link from 'next/link';

type InterviewRound = 'round1' | 'round2' | 'round3' | 'round4';

export default function InterviewsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roundFilter, setRoundFilter] = useState<string>('');

  // Fetch all registrations in interview stages
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
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['interview-stats'],
    queryFn: async () => {
      const response = await adminApi.getRegistrationStats();
      return response.data.data;
    },
  });

  const getRoundIcon = (round: number) => {
    switch (round) {
      case 1:
        return <Phone className="text-blue-600" size={20} />;
      case 2:
        return <Video className="text-green-600" size={20} />;
      case 3:
        return <Users className="text-purple-600" size={20} />;
      case 4:
        return <Video className="text-orange-600" size={20} />;
      default:
        return null;
    }
  };

  const getRoundBadgeColor = (status: string) => {
    if (status.includes('round1')) return 'bg-blue-100 text-blue-800';
    if (status.includes('round2')) return 'bg-green-100 text-green-800';
    if (status.includes('round3')) return 'bg-purple-100 text-purple-800';
    if (status.includes('round4')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
        <p className="text-gray-600 mt-1">Conduct and manage astrologer interviews</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Round 1 (Phone)</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.interviews?.round1 || 0}</p>
            </div>
            <Phone className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Round 2 (Video)</p>
              <p className="text-2xl font-bold text-green-600">{stats?.interviews?.round2 || 0}</p>
            </div>
            <Video className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Round 3 (Panel)</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.interviews?.round3 || 0}</p>
            </div>
            <Users className="text-purple-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Round 4 (Final)</p>
              <p className="text-2xl font-bold text-orange-600">{stats?.interviews?.round4 || 0}</p>
            </div>
            <Video className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search candidates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Rounds</option>
            <option value="interview_round_1">Round 1 - Phone Screening</option>
            <option value="interview_round_2">Round 2 - Video Interview</option>
            <option value="interview_round_3">Round 3 - Panel Interview</option>
            <option value="interview_round_4">Round 4 - Final Assessment</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setRoundFilter('');
            }}
            className="flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            <Filter size={18} className="mr-2" />
            Clear
          </button>
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Round
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.registrations
                  ?.filter((reg: any) => reg.status.includes('interview'))
                  ?.map((registration: any) => {
                    const currentRound = parseInt(registration.status.split('_').pop());
                    return (
                      <tr key={registration._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-semibold">
                                {registration.name?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{registration.name}</div>
                              <div className="text-sm text-gray-500">{registration.ticketNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{registration.phoneNumber}</div>
                          <div className="text-sm text-gray-500">{registration.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getRoundIcon(currentRound)}
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoundBadgeColor(registration.status)}`}>
                              Round {currentRound}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4].map((round) => (
                              <div
                                key={round}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                                  round < currentRound
                                    ? 'bg-green-500 text-white'
                                    : round === currentRound
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                              >
                                {round}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(registration.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/interviews/${registration._id}`}
                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                          >
                            <Eye size={18} className="mr-1" />
                            Conduct
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{data?.pagination?.pages || 1}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= data?.pagination?.pages}
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
