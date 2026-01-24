'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Mail, Calendar, Trash2, Edit, Activity, 
  CheckCircle, XCircle, Briefcase, User, Phone 
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/hooks/use-permission';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

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
  const [editForm, setEditForm] = useState({ 
    roleType: '', 
    department: '', 
    name: '',
    email: '', 
    phoneNumber: ''
  });
  const [statusReason, setStatusReason] = useState('');

  // 1. Fetch Admin Details
  const { data: admin, isLoading } = useQuery({
    queryKey: ['admin-detail', adminId],
    queryFn: async () => {
      const response = await adminApi.getAdminDetails(adminId);
      return response.data.data;
    },
    enabled: !!adminId,
  });

  // 2. Sync Data to Form (Fixes "Current Details" issue)
  useEffect(() => {
    if (admin) {
      setEditForm({
        roleType: admin.roleType || 'admin',
        department: admin.department || '',
        name: admin.name || '',
        email: admin.email || '',
        phoneNumber: admin.phoneNumber || ''
      });
    }
  }, [admin]);

  // 3. Update Admin Mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const payload = {
        name: data.name,
        roleType: data.roleType,
        department: data.department,
        phoneNumber: data.phoneNumber
      };
      return adminApi.updateAdmin(adminId, payload);
    },
    onSuccess: () => {
      toast.success('Admin profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-detail', adminId] });
      setShowEditModal(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  // 4. Update Status Mutation
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => adminApi.updateAdminStatus(adminId, newStatus, statusReason),
    onSuccess: () => {
      toast.success('Admin status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-detail', adminId] });
      setShowStatusModal(false);
      setStatusReason('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Status update failed'),
  });

  // 5. Delete Admin Mutation
  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAdmin(adminId),
    onSuccess: () => {
      toast.success('Admin deleted successfully');
      router.push('/admins');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Deletion failed'),
  });

  const handleEditSubmit = () => {
    if (!editForm.name.trim() || !editForm.roleType) {
      toast.error("Name and Role are required");
      return;
    }
    updateMutation.mutate(editForm);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (!admin) {
    return <div className="p-12 text-center text-gray-500">Admin profile not found</div>;
  }

  const isSelf = user?._id === admin._id;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()} 
          className="text-gray-600 hover:text-gray-900 pl-0 hover:bg-transparent"
        >
          <ArrowLeft size={18} className="mr-2" /> Back to Admins
        </Button>
      </div>

      {/* Main Profile Card */}
      <Card className="overflow-hidden border-t-4 border-t-indigo-600 shadow-md">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-3">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 text-4xl font-bold border-4 border-white shadow-lg">
                {admin.name.charAt(0).toUpperCase()}
              </div>
              <Badge 
                className={`capitalize px-3 py-1 ${
                  admin.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                  admin.status === 'suspended' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {admin.status}
              </Badge>
            </div>

            {/* Info Section */}
            <div className="flex-1 w-full space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{admin.name}</h1>
                  <div className="flex items-center gap-2 text-gray-500 mt-2 font-medium">
                    <Mail size={16} />
                    <span>{admin.email}</span>
                  </div>
                  {admin.phoneNumber && (
                     <div className="flex items-center gap-2 text-gray-500 mt-1 text-sm">
                      <Phone size={14} />
                      <span>{admin.phoneNumber}</span>
                    </div>
                  )}
                </div>
                
                {/* Role Badge */}
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Assigned Role</span>
                  <Badge variant="outline" className="text-sm px-3 py-1 capitalize border-indigo-200 text-indigo-700 bg-indigo-50">
                    {admin.roleType?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Grid Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <Briefcase size={16} /> Department
                  </div>
                  <p className="text-gray-900 font-medium pl-6">
                    {admin.department || <span className="text-gray-400 italic">Not Assigned</span>}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <Activity size={16} /> Last Active
                  </div>
                  <p className="text-gray-900 font-medium pl-6">
                    {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : <span className="text-gray-400 italic">Never logged in</span>}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                    <Calendar size={16} /> Date Added
                  </div>
                  <p className="text-gray-900 font-medium pl-6">
                    {new Date(admin.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {can('manage_admins') && !isSelf && (
            <div className="flex flex-wrap gap-3 mt-10 pt-6 border-t border-gray-100 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(true)}
                className="border-gray-300 hover:bg-gray-50 text-gray-700"
              >
                <Edit size={16} className="mr-2" /> Edit Details
              </Button>
              
              {admin.status === 'active' ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowStatusModal(true)}
                  className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
                >
                  <XCircle size={16} className="mr-2" /> Suspend Access
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  onClick={() => statusMutation.mutate('active')}
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                >
                  <CheckCircle size={16} className="mr-2" /> Activate Account
                </Button>
              )}

              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 size={16} className="mr-2" /> Delete Admin
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === MODALS === */}

      {/* Edit Admin Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Admin Profile</DialogTitle>
            <DialogDescription>
              Update the personal details and role assignment for this administrator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Read Only Email */}
            <div className="space-y-2">
              <Label className="text-gray-500">Email Address (Cannot be changed)</Label>
              <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-gray-600 text-sm">
                {editForm.email}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  id="name"
                  className="pl-9"
                  value={editForm.name} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                  placeholder="e.g. John Doe"
                  maxLength={50}
                  required
                />
              </div>
            </div>

            {/* Role & Department Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Assigned Role <span className="text-red-500">*</span></Label>
                <Select 
                  value={editForm.roleType} 
                  onValueChange={(val) => setEditForm({...editForm, roleType: val})}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="content_manager">Content Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department"
                  value={editForm.department} 
                  onChange={(e) => setEditForm({...editForm, department: e.target.value})} 
                  placeholder="e.g. Finance"
                />
              </div>
            </div>

             {/* Phone Number */}
             <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone"
                type="tel"
                value={editForm.phoneNumber} 
                onChange={(e) => setEditForm({...editForm, phoneNumber: e.target.value})} 
                placeholder="+91 9876543210"
                maxLength={15}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button 
              onClick={handleEditSubmit} 
              disabled={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
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
            <DialogDescription>
              This will prevent the admin from logging into the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Label htmlFor="reason">Reason for suspension <span className="text-red-500">*</span></Label>
            <Input 
              id="reason"
              value={statusReason} 
              onChange={(e) => setStatusReason(e.target.value)} 
              placeholder="e.g. Violation of internal policies"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => statusMutation.mutate('suspended')} 
              disabled={!statusReason || statusMutation.isPending}
            >
              {statusMutation.isPending ? 'Processing...' : 'Confirm Suspension'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 size={20} /> Delete Admin Account
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-gray-600 text-sm leading-relaxed">
              Are you sure you want to permanently delete <strong>{admin.name}</strong>? 
              <br/><br/>
              This action <strong>cannot be undone</strong> and will remove all their access rights immediately.
            </p>
          </div>
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