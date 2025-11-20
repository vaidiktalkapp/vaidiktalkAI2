// components/bulk-actions/BulkActionsToolbar.tsx
'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { toast } from 'sonner';
import { Ban, CheckCircle, Mail, Download } from 'lucide-react';

interface BulkActionsToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  entityType: 'users' | 'astrologers';
}

export default function BulkActionsToolbar({ 
  selectedIds, 
  onClearSelection,
  entityType 
}: BulkActionsToolbarProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkUpdateMutation = useMutation({
    mutationFn: (data: { action: string; ids: string[] }) =>
      adminApi.bulkUpdate(entityType, data),
    onSuccess: () => {
      toast.success(`✅ Updated ${selectedIds.length} ${entityType}`);
      queryClient.invalidateQueries({ queryKey: [entityType] });
      onClearSelection();
    },
    onError: () => {
      toast.error('Failed to perform bulk action');
    },
  });

  const handleBulkAction = (action: string) => {
    if (confirm(`Are you sure you want to ${action} ${selectedIds.length} ${entityType}?`)) {
      bulkUpdateMutation.mutate({ action, ids: selectedIds });
    }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      const response = await adminApi.exportData(entityType, selectedIds);
      // Download CSV
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${entityType}-export-${new Date().toISOString()}.csv`;
      a.click();
      toast.success('Export completed');
    } catch (error) {
      toast.error('Export failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium text-gray-900">
          {selectedIds.length} selected
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleBulkAction('activate')}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <CheckCircle size={16} />
            Activate
          </button>
          
          <button
            onClick={() => handleBulkAction('block')}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <Ban size={16} />
            Block
          </button>
          
          <button
            onClick={() => handleBulkAction('send_notification')}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Mail size={16} />
            Send Notification
          </button>
          
          <button
            onClick={handleExport}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50"
          >
            <Download size={16} />
            Export
          </button>
        </div>
        
        <button
          onClick={onClearSelection}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
