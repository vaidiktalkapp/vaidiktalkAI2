'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { astrologerService } from '../../../lib/astrologerService'; // Adjust path if needed
import { apiClient } from '../../../lib/api'; 
import toast from 'react-hot-toast';
import { Trash2, Loader2, AlertTriangle, ShieldAlert, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Image from 'next/image'; // Assuming you have a logo, if not remove Image component

export default function AstrologerDeleteAccountPage() {
  const router = useRouter();

  // State
  const [step, setStep] = useState<'phone' | 'otp' | 'confirm'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data
  const [countryCode, setCountryCode] = useState('91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [reason, setReason] = useState('');
  const [astrologerData, setAstrologerData] = useState<any>(null);

  // 1. Send OTP
  const handleSendOtp = async () => {
    if (phoneNumber.length < 10) return toast.error('Please enter a valid phone number');
    
    setIsLoading(true);
    try {
      // Step A: Check existence
      const checkRes = await astrologerService.checkPhone(phoneNumber, countryCode);
      
      if (checkRes.data?.data?.canLogin === false) {
        toast.error(checkRes.data.data.message || 'No astrologer account found with this number');
        setIsLoading(false);
        return;
      }

      // Step B: Send OTP
      const res = await astrologerService.sendLoginOtp(phoneNumber, countryCode);
      
      if (res.data?.success) {
        toast.success('OTP sent successfully');
        setStep('otp');
      } else {
        toast.error(res.data?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 4 && otp.length !== 6) return toast.error('Please enter a valid OTP');

    setIsLoading(true);
    try {
      const res = await astrologerService.verifyLoginOtp(phoneNumber, countryCode, otp);
      
      if (res.data?.success) {
        const { tokens, user, astrologer } = res.data.data;
        const profile = user || astrologer; 
        
        // Store token for delete request
        if (tokens?.accessToken) {
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
        
        setAstrologerData(profile);
        setStep('confirm');
        toast.success('Identity Verified');
      } else {
        toast.error(res.data?.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      toast.error(error.message || error.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Confirm Delete
  const handleDelete = async () => {
    if (!reason.trim()) return toast.error('Please provide a reason');

    setIsLoading(true);
    try {
      const res = await astrologerService.deleteAccount(reason);
      
      if (res.data?.success) {
        toast.success('Account scheduled for deletion');
        
        // Clean up
        delete apiClient.defaults.headers.common['Authorization'];
        setTimeout(() => router.push('/'), 1500); // Small delay to let toast show
      } else {
        toast.error(res.data?.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Delete Error:', error);
      toast.error(error.message || error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      
      {/* Navbar Placeholder / Back Button */}
      <div className="absolute top-6 left-6">
        <button 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header Section */}
        <div className="bg-red-50 p-6 text-center border-b border-red-100">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-red-600">
             <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Delete Astrologer Account</h1>
          <p className="text-sm text-gray-500 mt-1">Permanent removal request</p>
        </div>

        <div className="p-8">
          
          {/* --- STEP 1: PHONE --- */}
          {step === 'phone' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Registered Phone Number</label>
                <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-red-500 focus-within:border-transparent transition-all">
                  <div className="bg-gray-50 px-4 py-3 border-r border-gray-300 text-gray-600 font-medium">
                    +{countryCode}
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} // Only numbers
                    className="flex-1 px-4 py-3 outline-none text-gray-900 placeholder-gray-400"
                    placeholder="Enter number"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500">We'll send a verification OTP to this number.</p>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={isLoading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Send Verification OTP'}
              </button>
            </div>
          )}

          {/* --- STEP 2: OTP --- */}
          {step === 'otp' && (
            <div className="space-y-6 text-gray-900">
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-900">Enter Verification Code</p>
                <p className="text-sm text-gray-500">Sent to +{countryCode} {phoneNumber}</p>
              </div>

              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-[0.5em] font-bold py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-0 outline-none transition-colors"
                placeholder="••••••"
                maxLength={6}
                autoFocus
              />

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleVerifyOtp}
                  disabled={isLoading}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Verify & Proceed'}
                </button>
                <button 
                  onClick={() => setStep('phone')}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Change Phone Number
                </button>
              </div>
            </div>
          )}

          {/* --- STEP 3: CONFIRM --- */}
          {step === 'confirm' && (
            <div className="space-y-6 text-gray-900">
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg border-2 border-white shadow-sm">
                  {astrologerData?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{astrologerData?.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                    <CheckCircle2 size={12} /> Verified Account
                  </div>
                </div>
              </div>

              {/* Warning Box */}
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-800 text-sm space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={16} /> Action Required
                </div>
                <p className="leading-relaxed opacity-90">
                  Your profile will be hidden immediately. Data is permanently erased after <strong>7 days</strong> (reconciliation period).
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Reason for leaving</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm min-h-[100px] resize-none"
                  placeholder="Tell us why you're deleting your account..."
                />
              </div>

              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <><Trash2 size={18} /> Confirm Permanent Deletion</>}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}