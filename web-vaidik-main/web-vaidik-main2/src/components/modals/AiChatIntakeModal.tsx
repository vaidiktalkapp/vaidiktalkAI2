'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, MapPin, Calendar, Clock, Sparkles, Star, Shield, Globe } from 'lucide-react';
import { AiAstrologer } from '@/lib/aiAstrologerService';
import aiAstrologerService from '@/lib/aiAstrologerService';
import { useAuth } from '@/context/AuthContext';
import { AuthService } from '@/lib/AuthService';
import { toast } from 'react-hot-toast';

interface AiChatIntakeModalProps {
    isOpen: boolean;
    onClose: () => void;
    astrologer: AiAstrologer;
}

const AiChatIntakeModal = ({ isOpen, onClose, astrologer }: AiChatIntakeModalProps) => {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const currentBalance = user?.wallet?.balance || 0;
    const astrologerRate = Number(astrologer.chatRate || astrologer.rate || 0);
    const minRequiredBalance = 50;
    const isInsufficient = astrologerRate > 0 && currentBalance < minRequiredBalance;

    const [intakeData, setIntakeData] = useState({
        name: '',
        gender: 'Male',
        date: '',
        time: '',
        place: '',
        maritalStatus: 'Single',
        occupation: 'Employee',
        language: 'English'
    });

    useEffect(() => {
        if (isOpen && user) {
            const u = user as any;


            // Format date from ISO string to YYYY-MM-DD for input field
            let formattedDate = '';
            if (u.dateOfBirth) {
                const date = new Date(u.dateOfBirth);
                formattedDate = date.toISOString().split('T')[0]; // "2002-02-20"
            }

            setIntakeData({
                name: u.name || '',
                gender: u.gender ? (u.gender.charAt(0).toUpperCase() + u.gender.slice(1)) : 'Male',
                date: formattedDate,
                time: u.timeOfBirth || '',
                place: u.placeOfBirth || '',
                maritalStatus: u.maritalStatus || 'Single',
                occupation: u.occupation || 'Employee',
                language: astrologer.languages?.[0] || 'English'
            });


        }
    }, [isOpen, user, astrologer]);

    const handleIntakeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Update profile in background
            const profilePayload = {
                gender: intakeData.gender.toLowerCase(),
                dateOfBirth: intakeData.date,
                timeOfBirth: intakeData.time,
                placeOfBirth: intakeData.place,
            };

            console.log('📡 Sending profile update payload:', profilePayload);
            await AuthService.updateBirthDetails(profilePayload);

            // Refresh local user state
            if (refreshUser) refreshUser();

            // Start AI Chat Order (Next.js Path)
            const order = await aiAstrologerService.startAiChatOrder(
                astrologer._id,
                'chat',
                {
                    name: intakeData.name,
                    dateOfBirth: intakeData.date,
                    timeOfBirth: intakeData.time,
                    placeOfBirth: intakeData.place,
                    query: '',
                    language: intakeData.language
                }
            );

            // Validate order was created with valid ID
            if (!order || !order._id) {
                console.error('❌ [Intake Modal] Invalid order response:', order);
                toast.error('Failed to create chat session. Please try again.');
                return;
            }

            console.log('✅ [Intake Modal] Chat order created successfully:', {
                orderId: order._id,
                sessionId: order.sessionId,
                status: order.status
            });

            // Validate the orderId format (should be "AI-[timestamp]" or valid MongoDB ID)
            const orderId = order._id;
            if (!orderId || orderId === 'undefined' || orderId === 'null') {
                console.error('❌ [Intake Modal] Invalid orderId:', orderId);
                toast.error('Invalid session ID. Please try again.');
                return;
            }

            // Store intake for session display
            localStorage.setItem(`ai-chat-intake-${orderId}`, JSON.stringify({
                ...intakeData,
                query: ''
            }));

            toast.success('Starting your divine consultation...');
            console.log(`🚀 [Intake Modal] Navigating to: /ai-chat/${orderId}`);
            router.push(`/ai-chat/${orderId}`);
            onClose();
        } catch (err: any) {
            console.error("❌ [Intake Modal] Error starting consultation", err);
            const errorMessage = err.response?.data?.message || err.message || 'Failed to start consultation. Please try again.';
            toast.error(errorMessage);

            if (errorMessage.toLowerCase().includes('insufficient balance')) {
                router.push('/wallet/recharge');
            }
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (url?: string, name: string = 'AI') => {
        if (url && url.trim() !== '') return url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FB923C&color=fff&bold=true`;
    };

    if (!astrologer) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] overflow-y-auto p-4 flex items-start justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={loading ? undefined : onClose}
                        className="fixed inset-0 bg-gradient-to-br from-black/95 via-purple-900/40 to-black/95 backdrop-blur-md"
                    ></motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative bg-gradient-to-br from-orange-50 via-white to-amber-50 w-full max-w-xl my-auto rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.4)] border border-orange-200/50 z-10"
                    >
                        {/* Spiritual Background Patterns */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYwIDIwQzc2LjIgMjAgOTAgMzMuOCA5MCA1MEM5MCA2Ni4yIDc2LjIgODAgNjAgODBDNDMuOCA4MCAzMCA2Ni4yIDMwIDUwQzMwIDMzLjggNDMuOCAyMCA2MCAyMFoiIGZpbGw9IiNGRjlDMzYiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iI0ZGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0ZGOUMzNiI+KMm1PC90ZXh0Pjwvc3ZnPg==')] bg-repeat"></div>

                        {/* Header Section */}
                        <div className="relative h-12 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center text-white px-4">
                                    <h3 className="text-sm font-black uppercase tracking-widest">Divine Consultation</h3>
                                    <p className="text-orange-100 text-[11px] font-semibold">Accurate spiritual guidance based on birth stars</p>
                                </div>
                            </div>

                            {!loading && (
                                <button onClick={onClose} className="absolute top-2 right-2 p-1 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all backdrop-blur-sm">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="p-3">
                            <div className="flex flex-col gap-3">
                                {/* Top: Astrologer Info */}
                                <div className="flex items-center gap-3 bg-orange-50/50 p-2 rounded-2xl border border-orange-100">
                                    <img
                                        src={getImageUrl(astrologer.profileImage, astrologer.name)}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                        alt={astrologer.name}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-gray-900 text-sm">{astrologer.name}</h4>
                                            <div className="flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                <span className="text-[10px] font-bold">{(astrologer.rating || 4.8).toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-orange-700 font-bold uppercase tracking-tighter">
                                                {astrologer.specialization?.[0] || 'Vedic'} Expert
                                            </p>
                                            <div className="text-[10px] font-black text-orange-600 bg-white px-2 py-0.5 rounded-md border border-orange-100 shadow-sm">
                                                ₹{astrologerRate}/min
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleIntakeSubmit} className="space-y-2">
                                    {/* Horizontal grid layout for fields */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {/* Name */}
                                        <div className="relative">
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Full Name</label>
                                            <input
                                                type="text" required disabled={loading}
                                                value={intakeData.name}
                                                onChange={e => setIntakeData({ ...intakeData, name: e.target.value })}
                                                className="w-full px-3 py-2 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none shadow-sm placeholder-gray-400"
                                                placeholder="Your name"
                                            />
                                            <Sparkles className="absolute right-3 top-9 w-3.5 h-3.5 text-orange-500" />
                                        </div>

                                        {/* Gender */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">Gender</label>
                                            <div className="relative">
                                                <select
                                                    disabled={loading}
                                                    value={intakeData.gender}
                                                    onChange={e => setIntakeData({ ...intakeData, gender: e.target.value })}
                                                    className="w-full px-4 pr-10 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none appearance-none shadow-sm"
                                                >
                                                    <option>Male</option>
                                                    <option>Female</option>
                                                    <option>Other</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Birth Place */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">Place of Birth</label>
                                        <div className="relative">
                                            <input
                                                type="text" required disabled={loading}
                                                value={intakeData.place}
                                                onChange={e => setIntakeData({ ...intakeData, place: e.target.value })}
                                                className="w-full px-4 pr-10 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none shadow-sm placeholder-gray-400"
                                                placeholder="Enter city"
                                            />
                                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                                        </div>
                                    </div>

                                    {/* Date & Time - Horizontal Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">Date of Birth</label>
                                            <div className="relative">
                                                <input
                                                    type="date" required disabled={loading}
                                                    value={intakeData.date}
                                                    onChange={e => setIntakeData({ ...intakeData, date: e.target.value })}
                                                    className="w-full px-4 pr-10 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none shadow-sm [color-scheme:light]"
                                                />
                                                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">Time of Birth</label>
                                            <div className="relative">
                                                <input
                                                    type="time" required disabled={loading}
                                                    value={intakeData.time}
                                                    onChange={e => setIntakeData({ ...intakeData, time: e.target.value })}
                                                    className="w-full px-4 pr-10 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none shadow-sm [color-scheme:light]"
                                                />
                                                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Marital Status & Occupation - Horizontal Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Marital Status</label>
                                            <div className="relative">
                                                <select
                                                    disabled={loading}
                                                    value={intakeData.maritalStatus}
                                                    onChange={e => setIntakeData({ ...intakeData, maritalStatus: e.target.value })}
                                                    className="w-full px-3 pr-10 py-2 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none appearance-none shadow-sm"
                                                >
                                                    <option>Single</option>
                                                    <option>Married</option>
                                                    <option>Divorced</option>
                                                    <option>Widowed</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1">Occupation</label>
                                            <div className="relative">
                                                <select
                                                    disabled={loading}
                                                    value={intakeData.occupation}
                                                    onChange={e => setIntakeData({ ...intakeData, occupation: e.target.value })}
                                                    className="w-full px-3 pr-10 py-2 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none appearance-none shadow-sm"
                                                >
                                                    <option>Employee</option>
                                                    <option>Business</option>
                                                    <option>Student</option>
                                                    <option>Housewife</option>
                                                    <option>Retired</option>
                                                    <option>Other</option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orange-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Language */}
                                    <div>
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">Preferred Language</label>
                                        <div className="relative">
                                            <select
                                                disabled={loading}
                                                value={intakeData.language}
                                                onChange={e => setIntakeData({ ...intakeData, language: e.target.value })}
                                                className="w-full px-4 pr-10 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm font-black focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none appearance-none shadow-sm"
                                            >
                                                {astrologer.languages && astrologer.languages.length > 0 ? (
                                                    astrologer.languages.map(lang => (
                                                        <option key={lang} value={lang}>{lang}</option>
                                                    ))
                                                ) : (
                                                    ['English', 'Hindi', 'Tamil', 'Telugu', 'Bengali', 'Marathi'].map(lang => (
                                                        <option key={lang} value={lang}>{lang}</option>
                                                    ))
                                                )}
                                            </select>
                                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Low Balance Warning */}
                                    {isInsufficient && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col gap-2 animate-pulse mt-2">
                                            <div className="flex items-center gap-2 text-red-700">
                                                <div className="bg-red-100 p-1.5 rounded-full">
                                                    <Shield className="w-4 h-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase tracking-wider">Low Wallet Balance</span>
                                                    <span className="text-[10px] font-bold">Minimum ₹{minRequiredBalance} required to start chat.</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => router.push('/wallet/recharge')}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-1.5 rounded-lg transition-all shadow-md active:scale-95"
                                            >
                                                RECHARGE NOW TO CHAT
                                            </button>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={loading || isInsufficient}
                                        className={`w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 text-white font-black py-2.5 rounded-xl shadow-lg hover:shadow-orange-200/50 uppercase tracking-widest transition-all mt-2 border-b-4 border-orange-700 active:border-b-0 flex items-center justify-center gap-2 ${(loading || isInsufficient) ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:scale-[1.01] active:scale-[0.99]'
                                            }`}
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        {loading ? 'CONNECTING...' : 'START DIVINE CONSULTATION'}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-t border-orange-200 px-3 py-2 flex items-center justify-center">
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5 text-green-500" />
                                100% SECURE & CONFIDENTIAL
                            </p>
                        </div>

                        {/* Premium Loading Overlay */}
                        <AnimatePresence>
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 backdrop-blur-xl"
                                >
                                    <div className="relative">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 -m-6 border-2 border-dashed border-orange-200 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute inset-0 -m-3 bg-orange-100 rounded-full"
                                        />
                                        <motion.div
                                            animate={{ rotate: -360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            className="relative bg-white p-4 rounded-full shadow-2xl border-4 border-orange-400"
                                        >
                                            <Sparkles className="w-8 h-8 text-orange-500" />
                                        </motion.div>
                                    </div>

                                    <div className="mt-8 text-center space-y-3">
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="text-orange-900 font-black text-sm uppercase tracking-[0.2em]"
                                        >
                                            Consulting Stars
                                        </motion.div>
                                        <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">
                                            Connecting with {astrologer.name}...
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AiChatIntakeModal;
