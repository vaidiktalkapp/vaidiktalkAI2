'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { Plus, Trash2, Edit2, CheckCircle, XCircle, Star, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function RechargePacksPage() {
  const queryClient = useQueryClient();
  const [editingPack, setEditingPack] = useState<any>(null);
  
  // Form State
  const [amount, setAmount] = useState('');
  const [bonus, setBonus] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const { data: packs, isLoading } = useQuery({
    queryKey: ['recharge-packs'],
    queryFn: async () => {
      const res = await adminApi.getAllRechargePacks();
      return res.data.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => adminApi.saveRechargePack(data),
    onSuccess: () => {
      toast.success('Pack saved successfully');
      queryClient.invalidateQueries({ queryKey: ['recharge-packs'] });
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (amount: number) => adminApi.deleteRechargePack(amount),
    onSuccess: () => {
      toast.success('Pack deleted');
      queryClient.invalidateQueries({ queryKey: ['recharge-packs'] });
    },
  });

  const resetForm = () => {
    setEditingPack(null);
    setAmount('');
    setBonus('');
    setIsPopular(false);
    setIsActive(true);
  };

  const handleEdit = (pack: any) => {
    setEditingPack(pack);
    setAmount(pack.amount.toString());
    setBonus(pack.bonusPercentage.toString());
    setIsPopular(pack.isPopular);
    setIsActive(pack.isActive);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !bonus) return;
    
    saveMutation.mutate({
      amount: Number(amount),
      bonusPercentage: Number(bonus),
      isPopular,
      isActive
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recharge Packs & Bonuses</h1>
        <p className="text-gray-500">Configure recharge amounts and their bonus percentages dynamically.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editingPack ? 'Edit Pack' : 'Create New Pack'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recharge Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!!editingPack} // Prevent changing amount on edit (it's the key)
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                  placeholder="e.g. 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Percentage (%)</label>
                <input
                  type="number"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  User gets ₹{amount ? Math.floor(Number(amount) * (Number(bonus)/100)) : 0} bonus
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Mark Popular</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex justify-center items-center gap-2 font-medium"
                >
                  <Save size={18} /> {editingPack ? 'Update' : 'Save'} Pack
                </button>
                {editingPack && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
               <h3 className="font-semibold text-gray-900">Active Packs</h3>
               <span className="text-sm text-gray-500">{packs?.length || 0} packs found</span>
             </div>
             
             {isLoading ? (
               <div className="p-8 text-center">Loading...</div>
             ) : (
               <div className="divide-y divide-gray-100">
                 {packs?.map((pack: any) => (
                   <div key={pack._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                     <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold">
                         {pack.bonusPercentage}%
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                           <h4 className="font-bold text-gray-900">₹{pack.amount}</h4>
                           {pack.isPopular && (
                             <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium flex items-center gap-1">
                               <Star size={10} fill="currentColor" /> Popular
                             </span>
                           )}
                           {!pack.isActive && (
                             <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Inactive</span>
                           )}
                         </div>
                         <p className="text-sm text-gray-500">
                           User gets <span className="text-green-600 font-medium">₹{Math.floor(pack.amount * (pack.bonusPercentage/100))}</span> bonus
                         </p>
                       </div>
                     </div>

                     <div className="flex gap-2">
                       <button
                         onClick={() => handleEdit(pack)}
                         className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                       >
                         <Edit2 size={18} />
                       </button>
                       <button
                         onClick={() => {
                           if(confirm('Delete this pack?')) deleteMutation.mutate(pack.amount);
                         }}
                         className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                       >
                         <Trash2 size={18} />
                       </button>
                     </div>
                   </div>
                 ))}
                 
                 {packs?.length === 0 && (
                   <div className="p-8 text-center text-gray-500">
                     No recharge packs configured. Add one to start.
                   </div>
                 )}
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}