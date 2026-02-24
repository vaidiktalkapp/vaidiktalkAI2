'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import {
  Wallet, IndianRupee, ArrowUpRight, ArrowDownLeft,
  Search, User, CreditCard, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

export default function AdminWallet() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [showFullStatement, setShowFullStatement] = useState(false);

  // Fetch Users with wallet balances
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['all-users', searchTerm],
    queryFn: async () => {
      console.log('🔍 Fetching users from API...');
      const { data } = await adminApi.getAllUsers({ search: searchTerm, limit: 100 });
      console.log('📦 Raw API Response:', data);
      console.log('📦 data.data:', data.data);
      console.log('📦 data.data?.items:', data.data?.items);

      // Handle different response structures
      // API returns: { success: true, data: { users: [...], pagination: {...} } }
      const items = data.data?.users || data.data?.items || data.users || [];
      console.log('✅ Final parsed items:', items);
      console.log('✅ Items count:', Array.isArray(items) ? items.length : 'NOT AN ARRAY');

      return Array.isArray(items) ? items : [];
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Fetch AI Astrologer Wallet Stats
  const { data: statsData } = useQuery({
    queryKey: ['ai-astrologer-wallet-stats'],
    queryFn: async () => {
      const { data } = await adminApi.getAIAstrologerWalletStats();
      return data.data || {};
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Fetch AI Astrologer Transactions
  const { data: transactionsData } = useQuery({
    queryKey: ['ai-astrologer-transactions'],
    queryFn: async () => {
      const { data } = await adminApi.getAIAstrologerTransactions({ limit: 50 });
      return data.data?.items || [];
    },
    refetchInterval: 5000,
  });

  // Grant Credit Mutation
  const grantCreditMutation = useMutation({
    mutationFn: async ({ userId, amount }: { userId: string; amount: number }) => {
      return await adminApi.adjustWalletBalance(userId, amount, 'Admin credit');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('Credit granted successfully!');
      setIsModalOpen(false);
      setCreditAmount('');
      setSelectedUser(null);
    },
    onError: () => {
      toast.error('Failed to grant credit');
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await adminApi.deleteUser(userId, 'Admin deletion');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('User deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  const handleGrantCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !creditAmount) return;
    grantCreditMutation.mutate({
      userId: selectedUser._id,
      amount: parseFloat(creditAmount),
    });
  };

  const handleDeleteUser = (user: any) => {
    if (window.confirm(`Are you sure you want to delete user ${user.name}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user._id);
    }
  };

  const users = Array.isArray(usersData) ? usersData : [];
  const transactions = Array.isArray(transactionsData) ? transactionsData : [];
  const totalPlatformFloat = users.reduce((acc: number, u: any) => acc + (u.wallet?.balance || 0), 0);

  const filteredUsers = users.filter((u: any) => {
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(searchLower);
    const emailMatch = u.email?.toLowerCase().includes(searchLower);
    const phoneMatch = u.phoneNumber?.includes(searchTerm);

    // If search term is empty, show all users
    if (!searchTerm) return true;

    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Wallet <span className="text-slate-900">&amp; Billing</span>
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Manage user balances and platform transactions
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Balances Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-900" />
              User Wallet Balances
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {users.length} Total Users
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-bold text-left">
                <tr>
                  <th className="px-6 py-4 tracking-widest">User</th>
                  <th className="px-6 py-4 tracking-widest">Balance</th>
                  <th className="px-6 py-4 tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoadingUsers ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-xs text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: any) => (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-500 text-xs">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-sm font-bold text-slate-900 truncate">
                              {user.name || `User ${user.phoneNumber?.slice(-4) || 'Unknown'}`}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {user.email || user.phoneNumber || 'No contact info'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-slate-900 font-bold">
                          <IndianRupee className="w-3 h-3" />
                          {user.wallet?.balance || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsModalOpen(true);
                            }}
                            className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-black transition-colors"
                          >
                            Grant Credit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction Summary / Stats */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-bold opacity-60 uppercase tracking-widest mb-1">
                  Total Platform Float
                </p>
                <h2 className="text-4xl font-black tracking-tighter flex items-center gap-2">
                  <IndianRupee className="w-8 h-8" />
                  {totalPlatformFloat.toLocaleString()}
                </h2>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs opacity-80 leading-relaxed font-medium">
              Sum of all active user wallet balances currently held by the platform.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-sm mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-900" />
                {showFullStatement ? 'Full Billing Statement' : 'Recent Billing Activity'}
              </div>
              {showFullStatement && (
                <button
                  onClick={() => setShowFullStatement(false)}
                  className="text-[10px] font-bold text-slate-900 hover:text-black bg-slate-50 px-2 py-1 rounded-lg"
                >
                  Show Less
                </button>
              )}
            </h3>
            <div className={`space-y-4 ${showFullStatement ? 'max-h-[400px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
              {(showFullStatement ? transactions : transactions.slice(0, 5)).map((tx: any, idx: number) => (
                <div key={tx._id || idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${tx.type === 'credit'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-slate-100 text-slate-900'
                        }`}
                    >
                      {tx.type === 'credit' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-900 capitalize">
                        {tx.userId?.name ? `${tx.userId.name}: ` : ''}
                        {tx.description || 'AI Session Payment'}
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'} ·{' '}
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        }) : ''}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-xs font-black ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-900'
                      }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center text-xs text-slate-400 py-4">No transactions yet</div>
              )}
            </div>
            {!showFullStatement && transactions.length > 5 && (
              <button
                onClick={() => setShowFullStatement(true)}
                className="w-full mt-4 py-2 text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest border-t border-slate-50 pt-4"
              >
                View Full Statement
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Credit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-bold">Grant Wallet Credit</h3>
                <p className="text-xs text-slate-300">
                  Granting manual balance to {selectedUser?.name}
                </p>
              </div>
              <form onSubmit={handleGrantCredit} className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    Amount to Credit (₹)
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="number"
                      required
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-slate-900 font-bold text-lg focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={grantCreditMutation.isPending}
                    className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black shadow-xl shadow-slate-100 transition-all disabled:opacity-50"
                  >
                    {grantCreditMutation.isPending ? 'Processing...' : 'Confirm Credit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-8 border border-slate-200 text-slate-500 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
