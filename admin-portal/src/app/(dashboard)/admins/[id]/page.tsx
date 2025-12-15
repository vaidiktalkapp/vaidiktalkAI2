'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Shield, Mail, Calendar, Clock, 
  Trash2, Edit, Activity, CheckCircle, XCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function AdminDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const adminId = params.id as string;
  const { can, user } = usePermission();

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Form States
  const [editForm, setEditForm] = useState({ roleType: '', department: '', name: '' });
  const [statusReason, setStatusReason] = useState('');

  // 1. Fetch Admin Details
  const { data: admin, isLoading } = useQuery({
    queryKey: ['admin-detail', adminId],
    queryFn: async () => {
      const response = await adminApi.getAdminDetails(adminId); // Ensure this API method exists
      const data = response.data.data;
      setEditForm({
        roleType: data.roleType,
        department: data.department || '',
        name: data.name
      });
      return data;
    },
    enabled: !!adminId,
  });

  // 2. Update Admin Mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateAdmin(adminId, data), // Ensure this API method exists
    onSuccess: () => {
      toast.success('Admin profile updated');
      queryClient.invalidateQueries({ queryKey: ['admin-detail', adminId] });
      setShowEditModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  // 3. Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => adminApi.updateAdminStatus(adminId, newStatus, statusReason), // Ensure this API method exists
    onSuccess: () => {
      toast.success('Admin status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-detail', adminId] });
      setShowStatusModal(false);
      setStatusReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Status update failed'),
  });

  // 4. Delete Admin Mutation
  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAdmin(adminId), // Ensure this API method exists
    onSuccess: () => {
      toast.success('Admin deleted successfully');
      router.push('/admins');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Deletion failed'),
  });

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-indigo-600 rounded-full border-t-transparent"></div></div>;
  }

  if (!admin) {
    return <div className="p-12 text-center text-gray-500">Admin not found</div>;
  }

  const isSelf = user?._id === admin._id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Admins
        </Button>
      </div>

      {/* Main Profile Card */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold border-4 border-white shadow-sm">
              {admin.name.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{admin.name}</h1>
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <Mail size={14} />
                    <span>{admin.email}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={`capitalize ${
                    admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize border-indigo-200 text-indigo-700">
                    {admin.roleType.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                    <Shield size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Department</p>
                    <p className="text-sm font-medium text-gray-900">{admin.department || 'General'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Last Active</p>
                    <p className="text-sm font-medium text-gray-900">
                      {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Never'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Created At</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {can('manage_admins') && !isSelf && (
            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(true)}
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                <Edit size={16} className="mr-2" /> Edit Profile
              </Button>
              
              {admin.status === 'active' ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowStatusModal(true)}
                  className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                >
                  <XCircle size={16} className="mr-2" /> Suspend
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => statusMutation.mutate('active')}
                  className="border-green-200 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle size={16} className="mr-2" /> Activate
                </Button>
              )}

              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 size={16} className="mr-2" /> Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === MODALS === */}

      {/* Edit Admin Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select 
                value={editForm.roleType} 
                onValueChange={(val) => setEditForm({...editForm, roleType: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input 
                value={editForm.department} 
                onChange={(e) => setEditForm({...editForm, department: e.target.value})} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button 
              onClick={() => updateMutation.mutate(editForm)} 
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Status Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Admin Access</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Reason for suspension</Label>
            <Input 
              value={statusReason} 
              onChange={(e) => setStatusReason(e.target.value)} 
              placeholder="e.g. Policy violation"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => statusMutation.mutate('suspended')} 
              disabled={!statusReason || statusMutation.isPending}
            >
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Admin Account</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm">
            Are you sure you want to permanently delete <strong>{admin.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate()} 
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}