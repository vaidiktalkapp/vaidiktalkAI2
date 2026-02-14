'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Wallet, MessageSquare, BarChart2 } from 'lucide-react';

export default function AiAstrologersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Profiles', href: '/ai-astrologers', icon: Users, exact: true },
        { name: 'Wallet & Billing', href: '/ai-astrologers/wallet-billing', icon: Wallet },
        { name: 'Chat Logs', href: '/ai-astrologers/chat-logs', icon: MessageSquare },
        { name: 'Analytics', href: '/ai-astrologers/performance-analytics', icon: BarChart2 },
    ];

    return (
        <div className="flex flex-col h-full">
            
            {/* Page Content */}
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
