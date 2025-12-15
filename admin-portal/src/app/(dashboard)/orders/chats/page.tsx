'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Phone, Video, Timer, Activity } from 'lucide-react';
import { DataTable, Column } from '@/components/shared/DataTable';
import { toast } from 'sonner';

// Define Interface
interface CallOrder {
  _id: string;
  orderId: string;
  userId: { name: string; phoneNumber?: string; profileImage?: string };
  astrologerId: { name: string; profilePicture?: string };
  type: 'call' | 'video_call';
  totalAmount: number;
  status: string;
  duration?: number;
  createdAt: string;
}

export default function CallsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: activeCalls, isLoading: isLoadingActive } = useQuery({
    queryKey: ['active-calls'],
    queryFn: async () => {
      const response = await adminApi.getAllOrders({ status: 'ongoing', limit: 50 });
      return response.data.data.orders.filter((o: any) => o.type === 'call' || o.type === 'video_call');
    },
    refetchInterval: 10000,
  });

  const { data: callHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['call-history', page],
    queryFn: async () => {
      const response = await adminApi.getAllOrders({ page, limit: 20, type: 'call' });
      return response.data.data;
    },
  });

  const endCallMutation = useMutation({
    mutationFn: (orderId: string) => adminApi.forceEndCall(orderId),
    onSuccess: () => {
      toast.success('Call ended successfully');
      queryClient.invalidateQueries({ queryKey: ['active-calls'] });
    },
    onError: () => toast.error('Failed to end call'),
  });

  // Explicitly type Columns
  const columns: Column<CallOrder>[] = [
    { 
      header: 'Order ID', 
      accessorKey: 'orderId', 
      cell: (row) => <span className="font-mono text-xs">{row.orderId}</span> 
    },
    { 
      header: 'Type', 
      cell: (row) => row.type === 'video_call' ? <Video size={16} className="text-purple-600" /> : <Phone size={16} className="text-green-600" /> 
    },
    { 
      header: 'User', 
      cell: (row) => <span className="font-medium">{row.userId?.name}</span> 
    },
    { 
      header: 'Astrologer', 
      cell: (row) => row.astrologerId?.name 
    },
    { 
      header: 'Duration', 
      cell: (row) => row.duration ? `${Math.floor(row.duration / 60)}m ${row.duration % 60}s` : '-' 
    },
    { 
      header: 'Status', 
      accessorKey: 'status' 
    },
    { 
      header: 'Date', 
      cell: (row) => new Date(row.createdAt).toLocaleDateString() 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="text-green-600" /> Call Traction
          </h1>
          <p className="text-sm text-gray-500">Monitor live voice and video consultations</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => router.push('/orders')} className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">All Orders</button>
          <button className="px-4 py-1.5 text-sm font-medium bg-white text-gray-900 shadow-sm rounded-md">Calls & Video</button>
          <button onClick={() => router.push('/orders/chats')} className="px-4 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-md">Chats</button>
        </div>
      </div>

      {/* Live Calls */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Live Active Calls ({activeCalls?.length || 0})
          </h2>
        </div>

        {isLoadingActive ? (
          <div className="h-32 bg-gray-100 animate-pulse rounded-xl"></div>
        ) : activeCalls?.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 border border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">No calls currently active.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCalls?.map((call: any) => (
              <ActiveCallCard key={call._id} call={call} onEnd={() => endCallMutation.mutate(call.orderId)} />
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4">Call History</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <DataTable
            data={callHistory?.orders || []}
            columns={columns}
            isLoading={isLoadingHistory}
            pagination={{
              page,
              totalPages: callHistory?.pagination?.pages || 1,
              onPageChange: setPage,
            }}
          />
        </div>
      </section>
    </div>
  );
}

function ActiveCallCard({ call, onEnd }: { call: any; onEnd: () => void }) {
  const startTime = new Date(call.createdAt).getTime();
  const durationMin = Math.floor((Date.now() - startTime) / 60000);

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-green-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-2 bg-green-50 rounded-bl-xl text-green-700 text-xs font-bold flex items-center gap-1">
        <Activity size={12} className="animate-pulse" /> LIVE
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex -space-x-3">
          <img src={call.userId?.profileImage || '/placeholder.png'} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200" alt="User" />
          <img src={call.astrologerId?.profilePicture || '/placeholder.png'} className="w-10 h-10 rounded-full border-2 border-white bg-purple-200" alt="Astrologer" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{call.astrologerId?.name}</p>
          <p className="text-xs text-gray-500">with {call.userId?.name}</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          {call.type === 'video_call' ? <Video size={16} /> : <Phone size={16} />}
          <span className="capitalize">{call.type.replace('_', ' ')}</span>
        </div>
        <div className="flex items-center gap-1 text-green-700 font-mono font-bold">
          <Timer size={14} />
          {durationMin} mins
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition">
          Monitor
        </button>
        <button 
          onClick={onEnd}
          className="flex-1 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-1"
        >
          End Session
        </button>
      </div>
    </div>
  );
}