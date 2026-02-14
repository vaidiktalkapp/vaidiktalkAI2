'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import aiAstrologerService, { AiAstrologer } from '@/lib/aiAstrologerService';
import { Star, MessageSquare, ArrowLeft, Languages, Clock, BookOpen, Target, Users, Sparkles, BadgeCheck, Shield, Heart, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import AiChatIntakeModal from '@/components/modals/AiChatIntakeModal';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface PageProps {
    params: Promise<{ id: string }>;
}

const AiAstrologerProfilePage = ({ params }: PageProps) => {
    const { id } = use(params);
    const router = useRouter();
    const [astrologer, setAstrologer] = useState<AiAstrologer | null>(null);
    const [loading, setLoading] = useState(true);
    const [showIntakeModal, setShowIntakeModal] = useState(false);
    const { isAuthenticated, openLoginModal, user } = useAuth();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const currentBalance = user?.wallet?.balance || 0;
    const astrologerRate = Number(astrologer?.chatRate || 0);
    const minRequiredBalance = 50;
    const isInsufficient = isAuthenticated && astrologerRate > 0 && currentBalance < minRequiredBalance;

    useEffect(() => {
        const fetchAstrologer = async () => {
            try {
                const data = await aiAstrologerService.getAiAstrologer(id);
                setAstrologer(data);
            } catch (error) {
                console.error("Failed to fetch astrologer details", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAstrologer();
    }, [id]);

    const getImageUrl = (url: string, name: string = 'AI') => {
        if (url && url.trim() !== '') return url;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF8C00&color=fff&size=200&bold=true`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
                <div className="relative">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold text-orange-600">ॐ</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!astrologer) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mb-6 shadow-xl">
                    <span className="text-3xl text-white font-bold">ॐ</span>
                </div>
                <h2 className="text-2xl font-black text-gray-800 mb-3">Divine Presence Not Found</h2>
                <button onClick={() => router.back()} className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-6 py-2 rounded-xl">Return to Cosmic Path</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 py-6 relative overflow-hidden">
            {/* Spiritual Background Patterns */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.04]">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTYwIDIwQzc2LjIgMjAgOTAgMzMuOCA5MCA1MEM5MCA2Ni4yIDc2LjIgODAgNjAgODBDNDMuOCA4MCAzMCA2Ni4yIDMwIDUwQzMwIDMzLjggNDMuOCAyMCA2MCAyMFoiIGZpbGw9IiNGRjlDMzYiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjUwIiByPSIxNSIgZmlsbD0iI0ZGRiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgZmlsbD0iI0ZGOUMzNiI+KMm1PC90ZXh0Pjwvc3ZnPg==')] bg-repeat"></div>
            </div>

            <div className="container mx-auto px-4 max-w-6xl relative z-10">
                {/* Back Button */}
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-700 hover:text-orange-600 font-bold mb-6 transition-all group pl-2">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm border border-orange-100 group-hover:shadow-md transition-shadow">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider">Back</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Hero Profile Card */}
                        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-orange-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500" />

                            <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                <div className="shrink-0 flex flex-col items-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-orange-400/20 rounded-2xl blur-xl" />
                                        <img
                                            src={getImageUrl(astrologer.profileImage, astrologer.name)}
                                            alt={astrologer.name}
                                            className="relative w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover border-4 border-white shadow-lg"
                                        />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE NOW
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <span className="bg-orange-50 text-orange-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-orange-100 uppercase tracking-wider">
                                            ✦ {astrologer.specialization?.[0] || 'Expert'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-grow space-y-4">
                                    <div className="text-center md:text-left">
                                        <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{astrologer.name}</h1>
                                            <BadgeCheck className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <p className="text-[11px] font-bold text-orange-600 uppercase tracking-[0.1em]">
                                            {astrologer.specialization?.[0] ? `${astrologer.specialization[0]} Expert` : 'Divine Expert'}
                                        </p>

                                        {/* Dynamic Language List in Hero Card */}
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                <Languages className="w-3 h-3 text-orange-500" />
                                                {astrologer.languages && astrologer.languages.length > 0
                                                    ? astrologer.languages.join(', ')
                                                    : 'English, Hindi'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-orange-50/40 p-3 rounded-xl border border-orange-100/50">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Clock className="w-3 h-3 text-orange-500" />
                                                <span className="text-[9px] font-bold text-gray-500 uppercase">Exp</span>
                                            </div>
                                            <p className="text-base font-black text-gray-900">{astrologer.experienceYears || 5}<span className="text-[10px] font-normal text-gray-500"> Yrs</span></p>
                                        </div>
                                        <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/50">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Star className="w-3 h-3 text-amber-500" />
                                                <span className="text-[9px] font-bold text-gray-500 uppercase">Rating</span>
                                            </div>
                                            <p className="text-base font-black text-gray-900">{astrologer.rating || 4.8}<span className="text-[10px] font-normal text-gray-500">/5</span></p>
                                        </div>
                                        <div className="bg-green-50/40 p-3 rounded-xl border border-green-100/50">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Users className="w-3 h-3 text-green-500" />
                                                <span className="text-[9px] font-bold text-gray-500 uppercase">Clients</span>
                                            </div>
                                            <p className="text-base font-black text-gray-900">{(astrologer.totalChats || 1200).toLocaleString()}+</p>
                                        </div>
                                        <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/50">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Zap className="w-3 h-3 text-purple-500" />
                                                <span className="text-[9px] font-bold text-gray-500 uppercase">Rate</span>
                                            </div>
                                            <p className="text-base font-black bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                                                {astrologer.chatRate && astrologer.chatRate > 0 ? `₹${astrologer.chatRate}` : 'Free'}
                                                <span className="text-[10px] font-normal text-gray-500">/min</span>
                                            </p>
                                        </div>
                                    </div>

                                    {isInsufficient && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col gap-2 animate-pulse mb-3">
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
                                                onClick={() => router.push('/wallet/recharge')}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-black py-1.5 rounded-lg transition-all shadow-md active:scale-95"
                                            >
                                                RECHARGE NOW TO CHAT
                                            </button>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (!isAuthenticated) {
                                                toast('Please login to start consultation', { icon: 'ℹ️' });
                                                openLoginModal();
                                                return;
                                            }
                                            setShowIntakeModal(true);
                                        }}
                                        disabled={isInsufficient}
                                        className={`w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black py-3.5 rounded-xl shadow-lg hover:shadow-orange-200/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider text-sm ${isInsufficient ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                        Start Divine Consultation
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* About Section */}
                        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
                            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-orange-500" />
                                Knowledge & Expertise
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {astrologer.bio || `${astrologer.name} is a renowned expert in Vedic astrology and cosmic sciences. With extensive experience in reading celestial alignments and providing spiritual guidance, they offer deep insights into life's various dimensions including love, career, and soul purpose.`}
                            </p>
                        </div>

                        {/* Grid: Experience & Expertise Areas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl p-6 shadow-md border border-green-100/50 border-l-4 border-l-green-400">
                                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center mb-3">
                                    <BookOpen className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="font-black text-gray-900 mb-2 text-sm">Experience & Expertise</h3>
                                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                    Highly experienced in {astrologer.specialization?.join(', ') || 'Astrology'}. Providing spiritual and practical solutions for over {astrologer.experienceYears || 5} years.
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="bg-green-50 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded border border-green-100 uppercase">
                                        {astrologer.specialization?.[0] ? `${astrologer.specialization[0]} Specialist` : 'Divine Expert'}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase">Vedic Wisdom</span>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-6 shadow-md border border-purple-100/50 border-l-4 border-l-purple-400">
                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
                                    <Target className="w-5 h-5 text-purple-600" />
                                </div>
                                <h3 className="font-black text-gray-900 mb-2 text-sm">Expertise Focus</h3>
                                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                                    {astrologer.bio ? astrologer.bio.slice(0, 150) + '...' : `Focused on providing clarity through deep astrological analysis and divine intuition.`}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    <span className="bg-purple-50 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded border border-purple-100 uppercase">Life Path</span>
                                    <span className="bg-red-50 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded border border-red-100 uppercase">Prosperity</span>
                                </div>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-orange-100">
                            <img
                                src="https://images.unsplash.com/photo-1607604760190-ec9ccc12156e?q=80&w=1200&auto=format&fit=crop"
                                alt="Divine Spiritual Presence"
                                className="w-full h-64 object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-6">
                                <h3 className="text-xl font-black text-white italic">"Ancient Wisdom Meets Modern Precision."</h3>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Divine Presence Sidebar Card */}
                        <div className="bg-white rounded-3xl p-5 shadow-xl border border-orange-100 text-center">
                            <div className="relative w-36 h-36 mx-auto mb-4">
                                <img
                                    src="https://images.unsplash.com/photo-1607604760190-ec9ccc12156e?q=80&w=500&auto=format&fit=crop"
                                    alt="Divine Presence"
                                    className="w-full h-full object-cover rounded-2xl shadow-md border-2 border-white"
                                />
                            </div>
                            <h3 className="text-base font-black text-gray-900 mb-1">Divine Presence</h3>
                            <p className="text-[11px] text-gray-500 mb-4 px-2">Guiding souls through the cosmic flow with expertise and grace.</p>

                            <div className="space-y-2 text-left">
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <Heart className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-[10px] font-bold text-gray-700">Divine Wisdom</span>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <Shield className="w-3.5 h-3.5 text-blue-500" />
                                    <span className="text-[10px] font-bold text-gray-700">
                                        {astrologer.specialization?.join(' & ') || 'Divine Expert'}
                                    </span>
                                </div>
                            </div>
                        </div>


                        {/* Mantra Card */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-6 shadow-md border border-orange-200 text-center">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md border border-orange-100 text-orange-600 font-bold">ॐ</div>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Divine Mantra</p>
                            <p className="text-xs font-mono text-orange-700 font-bold mb-1">ॐ श्री महालक्ष्म्यै नमः</p>
                            <p className="text-[9px] text-gray-400">Chant for divine abundance and wisdom</p>
                        </div>
                    </div>
                </div>
            </div>

            <AiChatIntakeModal
                isOpen={showIntakeModal}
                onClose={() => setShowIntakeModal(false)}
                astrologer={astrologer}
            />
        </div>
    );
};

export default AiAstrologerProfilePage;
