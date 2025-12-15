'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api'; 
import { Plus, Trash2, Save, Gift, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RechargePack {
  id?: string;
  amount: number;
  bonusAmount: number;
  isActive: boolean;
}

export default function RechargePacksPage() {
  const queryClient = useQueryClient();
  // State for packs (initialize with API data or empty)
  const [packs, setPacks] = useState<RechargePack[]>([]);

  // TODO: Add this endpoint to your API client
  // const { data } = useQuery({ ... }); 

  const handleSave = () => {
    // Validation
    if (packs.some(p => p.amount <= 0)) {
      toast.error('Recharge amount must be greater than 0');
      return;
    }
    
    // Simulate API call
    console.log('Saving packs:', packs);
    toast.success('Recharge packs configuration saved');
    // mutation.mutate(packs);
  };

  const addPack = () => {
    setPacks([...packs, { id: `temp-${Date.now()}`, amount: 0, bonusAmount: 0, isActive: true }]);
  };

  const removePack = (index: number) => {
    const newPacks = [...packs];
    newPacks.splice(index, 1);
    setPacks(newPacks);
  };

  const updatePack = (index: number, field: keyof RechargePack, value: any) => {
    const newPacks = [...packs];
    newPacks[index] = { ...newPacks[index], [field]: value };
    setPacks(newPacks);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recharge Offers</h1>
          <p className="text-gray-600 mt-1">Configure bonus rewards for wallet top-ups</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Save size={18} /> Save Configuration
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="text-blue-600 shrink-0" size={20} />
        <p className="text-sm text-blue-800">
          These offers will be visible to users on the "Add Money" screen. The bonus amount is credited as "Promo Balance" and cannot be withdrawn.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 uppercase">
          <div className="col-span-4">Recharge Amount (₹)</div>
          <div className="col-span-4">Bonus Amount (₹)</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-1"></div>
        </div>

        <div className="divide-y divide-gray-100">
          {packs.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No active offers. Click "Add New Offer" to start.
            </div>
          )}
          
          {packs.map((pack, index) => (
            <div key={pack.id || index} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
              {/* Amount Input */}
              <div className="col-span-4 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input 
                  type="number" 
                  value={pack.amount}
                  onChange={(e) => updatePack(index, 'amount', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-medium"
                  placeholder="e.g. 500"
                />
              </div>

              {/* Bonus Input */}
              <div className="col-span-4 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">+</span>
                <input 
                  type="number" 
                  value={pack.bonusAmount}
                  onChange={(e) => updatePack(index, 'bonusAmount', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 border border-green-200 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-green-700 font-bold bg-green-50"
                  placeholder="e.g. 50"
                />
              </div>

              {/* Active Toggle */}
              <div className="col-span-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={pack.isActive}
                    onChange={(e) => updatePack(index, 'isActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">
                    {pack.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                <button 
                  onClick={() => removePack(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button 
            onClick={addPack}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 font-medium hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add New Offer
          </button>
        </div>
      </div>
    </div>
  );
}