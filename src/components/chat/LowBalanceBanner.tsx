'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface LowBalanceBannerProps {
    remainingTime: number; // in seconds
    onRechargeClick: () => void;
}

export default function LowBalanceBanner({ remainingTime, onRechargeClick }: LowBalanceBannerProps) {
    if (!remainingTime || remainingTime > 120 || remainingTime <= 0) return null;

    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    return (
        <div className="w-full bg-[#F8D900] px-4 py-2 border-b border-[#E0C100] flex items-center justify-between shrink-0 z-50">
            <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-black" />
                <p className="text-black text-sm font-medium">
                    Low balance! <span className="font-extrabold">{timeStr}</span> left
                </p>
            </div>
            <button
                onClick={onRechargeClick}
                className="bg-black text-[#F8D900] px-3 py-1 rounded-md text-xs font-bold hover:bg-gray-800 transition-colors"
            >
                Recharge
            </button>
        </div>
    );
}
