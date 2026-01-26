'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { AuthService } from '../../../lib/AuthService';
import { uploadService } from '../../../lib/upload.web';
import toast from 'react-hot-toast';
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  Camera,
  Edit2,
  Save,
  X,
  Loader2
} from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  
  // Modes: 'VIEW' | 'EDIT'
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    dateOfBirth: '',
    timeOfBirth: '',
    placeOfBirth: '',
    currentAddress: '',
    city: '',
    state: '',
    country: '',
    pincode: '',
    profileImage: '',
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        gender: user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : '', // Display as Capitalized
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        timeOfBirth: user.timeOfBirth ? user.timeOfBirth.slice(0, 5) : '', // Ensure HH:MM
        placeOfBirth: user.placeOfBirth || '',
        currentAddress: user.currentAddress || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        pincode: user.pincode || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');

    setIsUploading(true);
    const toastId = toast.loading('Uploading photo...');

    try {
      // 1. Upload Image
      const result = await uploadService.uploadImage(file);
      
      // 2. Prepare Payload
      const updateData = {
        profileImage: result.url,
      };

      // 3. Update Backend Immediately
      await AuthService.updateProfile(updateData);
      
      // 4. Update Local State
      setFormData(prev => ({ ...prev, profileImage: result.url }));
      await refreshUser();
      
      toast.success('Profile photo updated!', { id: toastId });
    } catch (error) {
      toast.error('Failed to upload photo', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    // 1. Basic Validation
    if (!formData.name.trim()) return toast.error('Name is required');
    if (!formData.dateOfBirth) return toast.error('Date of Birth is required');

    setIsSaving(true);
    try {
      // 2. SANITIZATION & PREPARATION
      const payload: any = {};

      if (formData.name) payload.name = formData.name.trim();
      
      // ✅ FIX: Lowercase gender for backend validation (enum: male, female, other)
      if (formData.gender) payload.gender = formData.gender.toLowerCase();
      
      if (formData.dateOfBirth) payload.dateOfBirth = formData.dateOfBirth;
      
      // ✅ FIX: Ensure Time is strictly HH:MM (Backend regex fails on HH:MM:SS)
      if (formData.timeOfBirth) payload.timeOfBirth = formData.timeOfBirth.slice(0, 5);
      
      if (formData.placeOfBirth) payload.placeOfBirth = formData.placeOfBirth.trim();
      
      // Optional fields - Only send if not empty
      if (formData.currentAddress?.trim()) payload.currentAddress = formData.currentAddress.trim();
      if (formData.city?.trim()) payload.city = formData.city.trim();
      if (formData.state?.trim()) payload.state = formData.state.trim();
      if (formData.country?.trim()) payload.country = formData.country.trim();
      
      // ✅ FIX: Validate Pincode (must be 6 digits, can't start with 0) to avoid 400 error
      if (formData.pincode?.trim()) {
         if (/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
             payload.pincode = formData.pincode.trim();
         } else {
             // Optional: You could show a toast here, or just ignore the invalid pincode
             console.warn("Skipping invalid pincode:", formData.pincode);
         }
      }

      if (formData.profileImage) {
        payload.profileImage = formData.profileImage;
      }

      console.log("Sending Payload:", payload); // Debugging

      // 3. Send Request
      await AuthService.updateProfile(payload);
      await refreshUser();
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      console.error("Update Error:", error);
      // Show specific backend validation message if available
      const message = error.message && Array.isArray(error.message) 
        ? error.message.join(', ') 
        : (error.message || 'Failed to update profile.');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        gender: user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        timeOfBirth: user.timeOfBirth ? user.timeOfBirth.slice(0, 5) : '',
        placeOfBirth: user.placeOfBirth || '',
        currentAddress: user.currentAddress || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        pincode: user.pincode || '',
        profileImage: user.profileImage || '',
      });
    }
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* --- HEADER CARD --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="h-32 bg-linear-to-r from-yellow-400 to-orange-400"></div>
          
          <div className="px-6 pb-6">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
                  <img 
                    src={formData.profileImage || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay for upload */}
                  <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="text-white" size={24} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mb-2">
                {isEditing ? (
                  <>
                    <button 
                      onClick={handleCancel}
                      className="px-4 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <X size={18} /> Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2 rounded-xl bg-yellow-400 text-black font-semibold hover:bg-yellow-500 shadow-sm transition-all flex items-center gap-2"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                      Save
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-2 rounded-xl border-2 border-yellow-400 text-yellow-700 font-semibold hover:bg-yellow-50 transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={18} /> Edit Profile
                  </button>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name || 'User'}</h1>
              <p className="text-gray-500 font-medium">+91 {user.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* --- MAIN FORM --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PERSONAL DETAILS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 text-gray-800">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
              <User className="text-yellow-500" size={20} /> Personal Details
            </h2>

            <div className="space-y-4">
              <InputField 
                label="Full Name" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                isEditing={isEditing} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="Gender" 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                  type="select" 
                  options={['Male', 'Female', 'Other']}
                />
                <InputField 
                  label="Date of Birth" 
                  name="dateOfBirth" 
                  value={formData.dateOfBirth} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                  type="date"
                  icon={<Calendar size={14} />}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <InputField 
                  label="Time of Birth" 
                  name="timeOfBirth" 
                  value={formData.timeOfBirth} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                  type="time"
                  icon={<Clock size={14} />}
                />
                 <InputField 
                  label="Place of Birth" 
                  name="placeOfBirth" 
                  value={formData.placeOfBirth} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                  icon={<MapPin size={14} />}
                />
              </div>
            </div>
          </div>

          {/* ADDRESS DETAILS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 text-gray-800">
             <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-3">
              <MapPin className="text-yellow-500" size={20} /> Address Details
            </h2>

            <div className="space-y-4">
              <InputField 
                label="Current Address" 
                name="currentAddress" 
                value={formData.currentAddress} 
                onChange={handleChange} 
                isEditing={isEditing} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label="City" 
                  name="city" 
                  value={formData.city} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                />
                <InputField 
                  label="State" 
                  name="state" 
                  value={formData.state} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <InputField 
                  label="Country" 
                  name="country" 
                  value={formData.country} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                />
                 <InputField 
                  label="Pincode" 
                  name="pincode" 
                  value={formData.pincode} 
                  onChange={handleChange} 
                  isEditing={isEditing} 
                  type="number"
                />
              </div>
            </div>
          </div>

        </div>

        {/* --- FOOTER --- */}
        {isEditing && (
            <div className="text-center pt-4 pb-8 opacity-50">
               <p className="text-xs text-gray-400">Ensure all details are correct before saving.</p>
            </div>
        )}
      </div>
    </div>
  );
}

// --- HELPER COMPONENT FOR INPUTS ---
function InputField({ 
  label, 
  name, 
  value, 
  onChange, 
  isEditing, 
  type = 'text', 
  options = [],
  icon 
}: any) {
  // VIEW MODE
  if (!isEditing) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        <div className="text-gray-800 font-medium text-base min-h-6 flex items-center gap-2 border-b border-gray-50 pb-1">
          {icon} {value || <span className="text-gray-300 font-normal italic">Not set</span>}
        </div>
      </div>
    );
  }

  // EDIT MODE
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all text-sm font-medium"
        >
          <option value="">Select {label}</option>
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none transition-all text-sm font-medium"
            placeholder={`Enter ${label}`}
          />
        </div>
      )}
    </div>
  );
}