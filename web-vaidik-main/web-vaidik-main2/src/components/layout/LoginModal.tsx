'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthService } from '../../lib/AuthService';
import toast from 'react-hot-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '91' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '44' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '61' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '1' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '971' },
];

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { sendOtp, verifyOtp, refreshUser } = useAuth();
  
  // Steps: PHONE -> OTP -> DETAILS (Mandatory if missing info)
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'DETAILS'>('PHONE');
  
  // Login State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  // Details Wizard State
  const [detailsStep, setDetailsStep] = useState(1);
  const [detailsData, setDetailsData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    birthTime: '',
    location: '',
  });

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- EFFECTS ---

  // Auto-focus logic
  useEffect(() => {
    if (isOpen) {
      if (step === 'PHONE') phoneInputRef.current?.focus();
      else if (step === 'OTP') otpInputRef.current?.focus();
      else if (step === 'DETAILS' && detailsStep === 1) nameInputRef.current?.focus();
    }
  }, [isOpen, step, detailsStep]);

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Outside click for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCountryDropdown]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('PHONE');
        setPhoneNumber('');
        setOtp('');
        setError(null);
        setResendTimer(0);
        setDetailsStep(1);
        setDetailsData({ name: '', gender: '', birthDate: '', birthTime: '', location: '' });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // --- LOGIN HANDLERS ---

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendOtp(phoneNumber, selectedCountry.dialCode);
      setStep('OTP');
      setResendTimer(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await verifyOtp(phoneNumber, selectedCountry.dialCode, otp);
      
      // ✅ STRICT CHECK: If user details are missing, FORCE Details Step
      // We do NOT call onClose() here if details are missing.
      const user = result.data?.user;
      if (user && (!user.name || !user.dateOfBirth)) {
        setStep('DETAILS'); // User MUST complete this to proceed
      } else {
        // Profile is complete, allow login
        toast.success('Login Successful!');
        onClose(); 
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await sendOtp(phoneNumber, selectedCountry.dialCode);
      setResendTimer(30);
      toast.success('OTP Resent');
    } catch (err: any) {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // --- DETAILS WIZARD HANDLERS ---

  const handleDetailsNext = () => {
    // Validation per step
    switch (detailsStep) {
      case 1: // Name
        if (!detailsData.name.trim()) return setError('Please enter your name');
        break;
      case 2: // Gender
        if (!detailsData.gender) return setError('Please select a gender');
        break;
      case 3: // DOB & AGE CHECK (13+)
        if (!detailsData.birthDate) return setError('Please select your birth date');
        
        // --- AGE VALIDATION START ---
        const birthDateObj = new Date(detailsData.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
          age--;
        }

        if (age < 13) {
          return setError('You must be at least 13 years old to use this application.');
        }
        // --- AGE VALIDATION END ---
        break;
      case 4: // Time
        if (!detailsData.birthTime) return setError('Please select your birth time');
        break;
      case 5: // Location
        if (!detailsData.location) return setError('Please enter your birth place');
        break;
    }

    setError(null);
    if (detailsStep < 5) {
      setDetailsStep(prev => prev + 1);
    } else {
      handleSubmitDetails();
    }
  };

  const handleDetailsBack = () => {
    if (detailsStep > 1) {
      setDetailsStep(prev => prev - 1);
      setError(null);
    }
  };

  const handleSubmitDetails = async () => {
    setLoading(true);
    try {
      const updateData = {
        name: detailsData.name.trim(),
        gender: detailsData.gender.toLowerCase(),
        dateOfBirth: detailsData.birthDate,
        timeOfBirth: detailsData.birthTime,
        placeOfBirth: detailsData.location.trim(),
      };

      await AuthService.updateProfile(updateData);
      await refreshUser(); // Update global context with new data
      
      toast.success('Profile Completed!');
      onClose(); // ✅ ONLY NOW do we allow the user into the app
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERERS ---

  const renderDetailsWizard = () => {
    const totalSteps = 5;
    const progress = (detailsStep / totalSteps) * 100;

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Dynamic Content */}
        <div className="min-h-[200px] flex flex-col justify-center animate-in fade-in slide-in-from-right-4 duration-300" key={detailsStep}>
          
          {detailsStep === 1 && (
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-800">What is your name?</label>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-4 text-lg placeholder:text-gray-700 text-gray-700 border-2 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none transition-all"
                value={detailsData.name}
                onChange={(e) => setDetailsData({ ...detailsData, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleDetailsNext()}
              />
            </div>
          )}

          {detailsStep === 2 && (
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-800">What is your gender?</label>
              <div className="grid grid-cols-2 gap-4">
                {['Male', 'Female'].map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                        setDetailsData({ ...detailsData, gender: g });
                        setTimeout(() => setDetailsStep(3), 200); 
                    }}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                      detailsData.gender === g 
                        ? 'border-yellow-400 bg-yellow-50 text-black' 
                        : 'border-gray-200 hover:border-yellow-200 text-gray-600'
                    }`}
                  >
                    <span className="text-3xl">{g === 'Male' ? '👨' : '👩'}</span>
                    <span className="font-bold">{g}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {detailsStep === 3 && (
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-800">Date of Birth</label>
              <p className="text-sm text-gray-500">You must be at least 13 years old.</p>
              <input
                type="date"
                className="w-full px-4 py-4 text-lg border-2 placeholder:text-gray-700 text-gray-700 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none"
                value={detailsData.birthDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDetailsData({ ...detailsData, birthDate: e.target.value })}
              />
            </div>
          )}

          {detailsStep === 4 && (
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-800">Time of Birth</label>
              <input
                type="time"
                className="w-full px-4 py-4 text-lg border-2 placeholder:text-gray-700 text-gray-700 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none"
                value={detailsData.birthTime}
                onChange={(e) => setDetailsData({ ...detailsData, birthTime: e.target.value })}
              />
            </div>
          )}

          {detailsStep === 5 && (
            <div className="space-y-4">
              <label className="text-xl font-bold text-gray-800">Place of Birth</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="City, State, Country"
                  className="w-full px-4 py-4 text-lg border-2 placeholder:text-gray-700 text-gray-700 border-gray-200 rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 outline-none pl-11"
                  value={detailsData.location}
                  onChange={(e) => setDetailsData({ ...detailsData, location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleDetailsNext()}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">📍</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          {detailsStep > 1 && (
            <button
              onClick={handleDetailsBack}
              className="px-6 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={handleDetailsNext}
            disabled={loading}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? 'Saving...' : detailsStep === 5 ? 'Complete Profile' : 'Next'}
            {!loading && detailsStep < 5 && (
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            )}
          </button>
        </div>
      </div>
    );
  };

  // --- MAIN RENDER ---

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      // 🔒 Prevent closing if in DETAILS step (Mandatory)
      onClick={() => { if (step !== 'DETAILS') onClose(); }}
    >
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative mx-4 animate-in zoom-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="from-yellow-400 via-yellow-500 to-yellow-400 bg-linear-to-r p-6 relative">
           <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
              {step === 'DETAILS' ? (
                <span className="text-3xl">📝</span>
              ) : (
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            {step === 'PHONE' && 'Welcome Back!'}
            {step === 'OTP' && 'Verify OTP'}
            {step === 'DETAILS' && 'Complete Your Profile'}
          </h2>
          <p className="text-center text-gray-800 text-sm mt-1 font-medium opacity-90">
            {step === 'PHONE' && 'Enter your phone number to continue'}
            {step === 'OTP' && 'Enter the code we sent to your phone'}
            {step === 'DETAILS' && 'These details are required for consultations'}
          </p>
          
          {/* 🔒 Hide Close Button if in DETAILS step */}
          {step !== 'DETAILS' && (
            <button 
                onClick={onClose}
                className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors text-gray-800"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 'DETAILS' ? (
            renderDetailsWizard()
          ) : step === 'PHONE' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Phone Number
                </label>
                <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-100 transition-all shadow-sm">
                  {/* Country Selector */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="px-4 py-3.5 bg-yellow-50 hover:bg-yellow-100 border-r-2 border-gray-200 text-gray-700 flex items-center gap-2 font-semibold transition-colors"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span>+{selectedCountry.dialCode}</span>
                      <svg className={`w-4 h-4 transition-transform ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white border-2 border-yellow-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
                        {COUNTRIES.map((country) => (
                          <button
                            key={country.code}
                            onClick={() => { setSelectedCountry(country); setShowCountryDropdown(false); phoneInputRef.current?.focus(); }}
                            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-yellow-50 transition-colors ${selectedCountry.code === country.code ? 'bg-yellow-100' : ''}`}
                          >
                            <span className="text-2xl">{country.flag}</span>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-gray-900">{country.name}</p>
                              <p className="text-sm text-gray-600">+{country.dialCode}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    placeholder="Enter phone number"
                    className="flex-1 px-4 py-3.5 outline-none bg-white text-gray-900 font-semibold text-base placeholder:text-gray-400"
                    value={phoneNumber}
                    onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, '')); setError(null); }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendOtp()}
                    maxLength={15}
                  />
                </div>
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading || phoneNumber.length < 7}
                className="w-full bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Get OTP</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </>
                )}
              </button>
            </div>
          ) : (
             <div className="space-y-6">
              {/* OTP Input Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-gray-700">Enter OTP</label>
                  <span className="text-sm text-gray-600 font-medium bg-yellow-50 px-3 py-1 rounded-full">{selectedCountry.flag} +{selectedCountry.dialCode} {phoneNumber}</span>
                </div>
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  placeholder="• • • • • •"
                  className="w-full text-center text-3xl font-bold tracking-[0.8em] border-2 border-yellow-200 rounded-xl px-4 py-4 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100 transition-all shadow-sm bg-yellow-50/30 text-gray-900 placeholder:text-gray-300"
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null); }}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyOtp()}
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                className="w-full bg-linear-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-black font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl text-base"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              <div className="flex items-center justify-between pt-2">
                <button onClick={() => { setStep('PHONE'); setOtp(''); setError(null); }} className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">
                  Change Number
                </button>
                <button onClick={handleResendOtp} disabled={resendTimer > 0 || loading} className="text-sm font-semibold disabled:text-gray-400 text-yellow-600 hover:text-yellow-700 disabled:cursor-not-allowed transition-colors">
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          {step === 'PHONE' && (
            <div className="mt-8 pt-6 border-t border-gray-200">
               <p className="text-xs text-center text-gray-500 leading-relaxed">
                By continuing, you agree to our <a href="#" className="text-yellow-600 hover:text-yellow-700 font-medium underline">Terms of Service</a> and <a href="#" className="text-yellow-600 hover:text-yellow-700 font-medium underline">Privacy Policy</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}