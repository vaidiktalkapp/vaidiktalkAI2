'use client';
import React, { useState, useEffect } from 'react';
import { useRegistration } from '../../context/RegistrationContext';
import { uploadService } from '../../../lib/upload.web';
import toast from 'react-hot-toast';
import { 
  User, 
  Calendar, 
  Users, 
  Languages, 
  Star, 
  Smartphone, 
  Mail, 
  Camera, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  Briefcase,
} from 'lucide-react';

// --- CONSTANTS ---
const SKILLS = [
  'Vedic', 
  'KP', 
  'Palmistry', 
  'Face Reading', 
  'Tarot', 
  'Vastu', 
  'Healing', 
  'Numerology', 
  'Kundli'
];

const LANGUAGES_LIST = [
  'English', 
  'Hindi', 
  'Marathi', 
  'Gujarati', 
  'Punjabi', 
  'Haryanvi', 
  'Bengali', 
  'Tamil', 
  'Telugu', 
  'Kannada', 
  'Bhojpuri', 
  'Sindhi', 
  'Odia', 
  'Dogri', 
  'Kashmiri'
];

// Updated Steps to include Experience/Bio
const STEPS = [
  { id: 1, key: 'name', icon: User },
  { id: 2, key: 'gender', icon: Users },
  { id: 3, key: 'dob', icon: Calendar },
  { id: 4, key: 'professional', icon: Briefcase }, // Experience & Bio
  { id: 5, key: 'languages', icon: Languages },
  { id: 6, key: 'skills', icon: Star },
  { id: 7, key: 'contact', icon: Smartphone },
  { id: 8, key: 'photo', icon: Camera },
];

export default function FormWizard() {
  const { submitRegistration, state } = useRegistration();
  const [currentStep, setCurrentStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    experienceYears: '', // New field
    bio: '',             // New field
    languages: [] as string[],
    skills: [] as string[],
    phoneModel: '',
    email: '',
    profilePicture: null as File | null,
    profilePictureUrl: '',
    previewUrl: '',
  });

  const updateData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // --- VALIDATION HANDLER ---
  const handleNext = () => {
    switch (currentStep) {
      case 1: // Name
        if (!formData.name.trim()) return toast.error('Please enter your full name');
        break;
      case 2: // Gender
        if (!formData.gender) return toast.error('Please select your gender');
        break;
      case 3: // DOB & Age Check (18+)
        if (!formData.dateOfBirth) return toast.error('Please select your birth date');
        
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        // Astrologers should be adults
        if (age < 18) return toast.error('You must be at least 18 years old to register as an Astrologer.');
        break;
      case 4: // Professional (Experience & Bio)
        if (!formData.experienceYears) return toast.error('Please enter your years of experience');
        if (!formData.bio.trim()) return toast.error('Please write a short bio');
        if (formData.bio.length < 50) return toast.error('Bio should be at least 50 characters long');
        break;
      case 5: // Languages
        if (formData.languages.length === 0) return toast.error('Select at least one language');
        break;
      case 6: // Skills
        if (formData.skills.length === 0) return toast.error('Select at least one skill');
        break;
      case 7: // Contact
        if (!formData.phoneModel) return toast.error('Please select your device type');
        break;
      case 8: // Photo
        if (!formData.profilePictureUrl) return toast.error('Please upload a professional profile picture');
        break;
    }

    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, previewUrl, profilePicture: file }));

    setIsUploading(true);
    try {
      const result = await uploadService.uploadImage(file);
      setFormData(prev => ({ ...prev, profilePictureUrl: result.url }));
      toast.success('Image uploaded successfully!');
    } catch {
      toast.error('Failed to upload image. Please try again.');
      URL.revokeObjectURL(previewUrl);
      setFormData(prev => ({ ...prev, previewUrl: '', profilePicture: null }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (isUploading) return toast.error('Please wait for image upload to finish');

    const payload = {
      name: formData.name,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      experienceYears: parseInt(formData.experienceYears),
      bio: formData.bio,
      languagesKnown: formData.languages,
      skills: formData.skills,
      email: formData.email,
      profilePicture: formData.profilePictureUrl,
      deviceType: formData.phoneModel,
    };

    try {
      await submitRegistration(payload);
    } catch (err: any) {
      toast.error(err.formattedMessage || 'Registration failed');
    }
  };

  useEffect(() => {
    return () => {
      if (formData.previewUrl) URL.revokeObjectURL(formData.previewUrl);
    };
  }, [formData.previewUrl]);

  // --- RENDERERS ---

  const renderDots = () => (
    <div className="flex justify-center gap-2 mb-8">
      {STEPS.map((step) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        return (
          <div
            key={step.id}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-[#5b2b84] text-white scale-110 shadow-lg' 
                : isCompleted 
                  ? 'bg-purple-100 text-[#5b2b84]' 
                  : 'bg-slate-100 text-slate-300'
            }`}
          >
            <step.icon size={14} />
          </div>
        );
      })}
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case 1: // Name
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Welcome, Astrologer! 🙏</h2>
              <p className="text-slate-500">Let's build your professional profile. What is your name?</p>
            </div>
            <input
              autoFocus
              className="w-full text-center text-xl font-medium border-b-2 border-slate-200 bg-transparent py-4 focus:border-[#5b2b84] focus:outline-none transition-colors placeholder:text-slate-300"
              placeholder="e.g. Acharya Vinod"
              value={formData.name}
              onChange={e => updateData('name', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
            />
          </div>
        );

      case 2: // Gender
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Gender</h2>
              <p className="text-slate-500">This helps clients connect with you.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Male', 'Female'].map(g => (
                <button
                  key={g}
                  onClick={() => {
                    updateData('gender', g.toLowerCase());
                    setTimeout(handleNext, 200);
                  }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 ${
                    formData.gender === g.toLowerCase()
                      ? 'border-[#5b2b84] bg-purple-50'
                      : 'border-slate-100 bg-white hover:border-purple-200'
                  }`}
                >
                  <div className={`p-4 rounded-full ${
                    formData.gender === g.toLowerCase() ? 'bg-[#5b2b84] text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {g === 'Male' ? <User size={32} /> : <Users size={32} />}
                  </div>
                  <span className="font-semibold text-slate-700">{g}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3: // DOB
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Date of Birth 🎂</h2>
              <p className="text-slate-500">We need this to verify your age (Must be 18+).</p>
            </div>
            <div className="flex justify-center">
              <input
                type="date"
                className="w-full max-w-xs text-center p-4 rounded-xl border border-slate-200 bg-slate-50 text-lg focus:ring-2 focus:ring-[#5b2b84] focus:outline-none"
                value={formData.dateOfBirth}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => updateData('dateOfBirth', e.target.value)}
              />
            </div>
          </div>
        );

      case 4: // Professional (Experience & Bio)
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Professional Details 💼</h2>
              <p className="text-slate-500">Tell us about your experience.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#5b2b84] focus:ring-1 focus:ring-[#5b2b84] outline-none"
                  placeholder="e.g. 5"
                  value={formData.experienceYears}
                  onChange={e => updateData('experienceYears', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Short Bio</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#5b2b84] focus:ring-1 focus:ring-[#5b2b84] outline-none min-h-[100px]"
                  placeholder="I am a Vedic astrologer with expertise in..."
                  value={formData.bio}
                  onChange={e => updateData('bio', e.target.value)}
                />
                <p className="text-xs text-right text-slate-400">
                  {formData.bio.length} characters (Min 50)
                </p>
              </div>
            </div>
          </div>
        );

      case 5: // Languages
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Languages 🗣️</h2>
              <p className="text-slate-500">Which languages can you consult in?</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {LANGUAGES_LIST.map(lang => {
                const isSelected = formData.languages.includes(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => updateData('languages', isSelected 
                      ? formData.languages.filter(l => l !== lang) 
                      : [...formData.languages, lang]
                    )}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-[#5b2b84] text-white shadow-md transform scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lang} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 6: // Skills
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Your Expertise 🔮</h2>
              <p className="text-slate-500">Select your core skills.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {SKILLS.map(skill => {
                const isSelected = formData.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => updateData('skills', isSelected 
                      ? formData.skills.filter(s => s !== skill) 
                      : [...formData.skills, skill]
                    )}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#5b2b84] bg-purple-50 text-[#5b2b84] font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {skill}
                    {isSelected && <Star size={16} fill="#5b2b84" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 7: // Contact
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Device & Contact 📱</h2>
              <p className="text-slate-500">Required for app compatibility.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Primary Device</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Android', 'iPhone'].map(model => (
                    <button
                      key={model}
                      onClick={() => updateData('phoneModel', model)}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                        formData.phoneModel === model
                          ? 'border-[#5b2b84] bg-purple-50 text-[#5b2b84]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#5b2b84] focus:ring-1 focus:ring-[#5b2b84] outline-none"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={e => updateData('email', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 8: // Photo
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold text-slate-900">Profile Picture 📸</h2>
              <p className="text-slate-500">Upload a professional photo (Headshot).</p>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="relative group cursor-pointer">
                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${
                  formData.previewUrl ? 'border-[#5b2b84]' : 'border-slate-100 bg-slate-50'
                }`}>
                  {formData.previewUrl ? (
                    <img src={formData.previewUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <User size={48} />
                    </div>
                  )}
                </div>
                
                <label className="absolute bottom-0 right-0 p-2 bg-[#5b2b84] rounded-full text-white shadow-lg cursor-pointer hover:bg-[#4a236b] transition-colors">
                  <Camera size={20} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {isUploading && <span className="text-sm text-[#5b2b84] font-medium animate-pulse">Uploading image...</span>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        {currentStep > 1 ? (
          <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <ChevronLeft size={24} />
          </button>
        ) : (
          <div className="w-10" /> 
        )}
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Step {currentStep} of {STEPS.length}
        </span>
        <div className="w-10" />
      </div>

      {/* Progress Dots */}
      {renderDots()}

      {/* Main Content Card */}
      <div className="min-h-[350px] flex flex-col justify-between">
        {renderContent()}

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={handleNext}
            disabled={state.isLoading || isUploading}
            className="w-full group flex items-center justify-center gap-2 bg-[#5b2b84] hover:bg-[#4a236b] text-white py-4 rounded-2xl font-semibold text-lg transition-all shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.isLoading ? (
              <Loader2 className="animate-spin" />
            ) : currentStep === STEPS.length ? (
              'Complete Registration'
            ) : (
              <>
                Next <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}