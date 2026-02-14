'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useRealTime } from '../../context/RealTimeContext';
import { Astrologer } from '../../lib/types';

interface Props {
  astrologer: Astrologer;
  mode: 'chat' | 'call';
}

const AstrologerCard: React.FC<Props> = ({ astrologer, mode }) => {
  const router = useRouter();
  const { isAuthenticated, openLoginModal } = useAuth();
  const { initiateChat, initiateCall, isChatProcessing, isCallProcessing } = useRealTime();
  
  const { tier, availability } = astrologer;

  // --- LOGIC FROM HOME.JS (React Native) ---
  // Priority: realStatus > availability flags
  const status = astrologer.realStatus || 
     (availability?.isLive ? 'live' : 
     (availability?.busyUntil ? 'busy' : 
     (availability?.isOnline ? 'online' : 'offline')));

  const isLive = status === 'live';
  const isBusy = status === 'busy';
  const isOnline = status === 'online';
  const isOffline = status === 'offline';
  // ------------------------------------------

  // Badge styling
  const badgeClasses =
    tier === 'celebrity'
      ? 'bg-black text-yellow-400'
      : tier === 'top_choice' || tier === 'top-choice'
      ? 'bg-green-500 text-white'
      : tier === 'rising_star' || tier === 'rising-star'
      ? 'bg-orange-500 text-white'
      : '';

  // Status Dot Color
  let dotColor = 'bg-gray-400'; // Offline
  if (isLive) dotColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse'; // Red & Pulse
  else if (isBusy) dotColor = 'bg-orange-500'; // Orange
  else if (isOnline) dotColor = 'bg-green-500'; // Green

  const skills = (astrologer.specializations || []).slice(0, 2).join(', ');
  const langs = (astrologer.languages || []).slice(0, 2).join(', ');

  // Wait time calculation
  const waitTime = useMemo(() => {
    if (!isBusy || !availability.busyUntil) return 0;
    
    const now = new Date();
    const busyUntil = new Date(availability.busyUntil);
    const diffMinutes = Math.ceil((busyUntil.getTime() - now.getTime()) / 60000);
    
    return Math.max(1, diffMinutes);
  }, [isBusy, availability.busyUntil]);

  const price = mode === 'chat' ? astrologer.pricing.chat : astrologer.pricing.call;
  const originalPrice = Math.round((price || 25) * 1.22);

  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (isOffline) {
      alert('Astrologer is currently offline');
      return;
    }

    if (mode === 'chat') {
      await initiateChat(astrologer);
    } else {
      await initiateCall(astrologer, 'audio');
    }
  };

  const isProcessing = mode === 'chat' ? isChatProcessing : isCallProcessing;

  return (
    <div 
      className="relative flex bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow text-black cursor-pointer group"
      onClick={() => router.push(`/astrologer/${astrologer._id}`)}
    >
      {/* Badge */}
      {tier && tier !== 'none' && (
        <div className={`absolute -top-0.5 -left-0.5 px-2 py-1 rounded-tr-lg rounded-bl-lg text-[10px] font-bold z-10 ${badgeClasses}`}>
          {String(tier).replace(/_/g, ' ').replace('-', ' ').toUpperCase()}
        </div>
      )}

      {/* Avatar Section */}
      <div className="relative w-20 flex flex-col items-center mr-3 mt-2">
        <div className="relative">
          <img
            src={astrologer.profilePicture || 'https://i.pravatar.cc/100'}
            alt={astrologer.name}
            className={`w-16 h-16 rounded-full object-cover border-2 ${isLive ? 'border-red-500' : 'border-gray-100'}`}
          />
          {/* Status Dot */}
          {!isOffline && (
            <div className={`absolute bottom-0 right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${dotColor}`} />
          )}
        </div>
        <div className="mt-1 text-center">
          <div className="text-[10px] text-yellow-500 flex items-center justify-center gap-0.5">
            <span>⭐</span>
            <span className="font-bold">{astrologer.ratings?.average?.toFixed(1) || '5.0'}</span>
          </div>
          <div className="text-[10px] text-gray-400">
            {astrologer.stats?.totalOrders || 0} orders
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 ml-1 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <p className="font-bold text-[15px] truncate text-slate-800 group-hover:text-[#102C57] transition-colors">
            {astrologer.name}
          </p>
        </div>

        <p className="text-[12px] text-gray-500 mt-0.5 truncate">{skills}</p>
        <p className="text-[12px] text-gray-500 mt-0.5 truncate">{langs || 'English'}</p>
        <p className="text-[12px] text-gray-500 mt-0.5">Exp: {astrologer.experienceYears || 0} Years</p>

        <div className="flex items-center mt-2 gap-2">
          <span className="text-[12px] text-gray-400 line-through">
            ₹{originalPrice}
          </span>
          <span className="text-[14px] font-bold text-red-600">
            ₹{price}/min
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100 font-medium">
            Offer
          </span>
        </div>
      </div>

      {/* Action Button Section */}
      <div className="flex items-center ml-2 min-w-20 justify-end">
        {isLive ? (
          <button
            disabled
            className="px-4 py-1.5 rounded-full border border-red-500 bg-red-50 text-red-600 text-[12px] font-bold cursor-default"
          >
            Live
          </button>
        ) : isBusy ? (
          <div className="flex flex-col items-end">
             <button
              disabled
              className="px-4 py-1.5 rounded-full border border-orange-500 bg-orange-50 text-orange-600 text-[12px] font-bold cursor-default mb-1"
            >
              Busy
            </button>
            {waitTime > 0 && <span className="text-[10px] text-orange-500 font-medium">~{waitTime}m</span>}
          </div>
        ) : isOnline ? (
          <button
            onClick={handleAction}
            disabled={isProcessing}
            className={`px-4 py-1.5 rounded-full border border-green-500 bg-white hover:bg-green-50 text-green-600 text-[13px] font-bold transition-all shadow-sm ${
              isProcessing ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {isProcessing ? 'Wait...' : (mode === 'chat' ? 'Chat' : 'Call')}
          </button>
        ) : (
          <button
            disabled
            className="px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-400 text-[12px] font-medium cursor-not-allowed"
          >
            Offline
          </button>
        )}
      </div>
    </div>
  );
};

export default AstrologerCard;