'use client';

import React, { useState } from 'react';
import { X, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import paymentService from '../../lib/paymentService';
import { useAuth } from '../../context/AuthContext';

interface QuickRechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    ratePerMinute: number;
    astrologerName: string;
    onSuccess?: (newBalance: number) => void;
}

const GST_RATE = 18;

export default function QuickRechargeModal({
    isOpen,
    onClose,
    ratePerMinute,
    astrologerName,
    onSuccess
}: QuickRechargeModalProps) {
    const { user, fetchUserProfile } = useAuth();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!isOpen) return null;

    const calculatePrice = (minutes: number) => {
        const baseAmount = minutes * ratePerMinute;
        const gstAmount = Math.round((baseAmount * GST_RATE) / 100);
        const totalAmount = baseAmount + gstAmount;
        return { baseAmount, gstAmount, totalAmount };
    };

    const handleRecharge = async (minutes: number) => {
        if (isProcessing) return;
        setIsProcessing(true);

        const { baseAmount } = calculatePrice(minutes);

        try {
            await paymentService.completeRazorpayFlow(
                baseAmount,
                {
                    phone: user?.phoneNumber,
                    name: user?.name,
                    email: user?.email,
                    bonusPercentage: 0
                },
                async (newBalance: number) => {
                    setIsProcessing(false);
                    await fetchUserProfile();
                    if (onSuccess) onSuccess(newBalance);
                    onClose();
                },
                (err: any) => {
                    setIsProcessing(false);
                    alert(err || 'Payment failed');
                }
            );
        } catch (error: any) {
            setIsProcessing(false);
            alert(error.message || 'Something went wrong');
        }
    };

    const options = [1, 5, 10];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-extrabold text-[#102C57]">Recharge & Continue</h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">Session with {astrologerName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isProcessing}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="flex items-center gap-2 bg-[#FFF3E0] p-3 rounded-xl mb-6">
                        <AlertCircle className="w-5 h-5 text-[#E65100] shrink-0" />
                        <p className="text-sm font-semibold text-[#E65100]">
                            Your balance is low. Session will end soon.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {options.map((mins) => {
                            const { baseAmount, gstAmount, totalAmount } = calculatePrice(mins);
                            return (
                                <button
                                    key={mins}
                                    onClick={() => handleRecharge(mins)}
                                    disabled={isProcessing}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-gray-100 hover:border-[#F8D900] bg-gray-50 hover:bg-[#FFFDF0] transition-all disabled:opacity-50 disabled:cursor-not-allowed group text-left"
                                >
                                    <div>
                                        <h3 className="text-lg font-bold text-[#102C57] mb-1">
                                            {mins} Minute{mins > 1 ? 's' : ''}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            Credits: ₹{baseAmount} + GST: ₹{gstAmount}
                                        </p>
                                    </div>
                                    <div className="bg-[#F8D900] px-4 py-2 rounded-xl text-right group-hover:bg-[#F0C800] transition-colors">
                                        <span className="block text-[10px] font-bold text-[#102C57] uppercase opacity-70 mb-0.5">Pay</span>
                                        <span className="block text-base font-extrabold text-[#102C57]">₹{totalAmount}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-5 font-medium">
                        *Prices include 18% GST
                    </p>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 py-4 px-6 border-t border-gray-100 flex items-center justify-center gap-2 text-gray-500">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-semibold">Secure Payments by Razorpay</span>
                </div>

                {/* Processing Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                        <Loader2 className="w-10 h-10 text-[#F8D900] animate-spin mb-4" />
                        <p className="text-[#102C57] font-bold text-lg animate-pulse">Processing Payment...</p>
                    </div>
                )}

            </div>
        </div>
    );
}
