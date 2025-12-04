'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header'; // Ensure you have this basic header
import NotificationProvider from '@/components/providers/NotificationProvider'; // Your existing provider

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, token, hydrate } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Attempt to hydrate state from localStorage
    hydrate(); 
    
    // 2. Check Auth
    const storedToken = localStorage.getItem('admin_token');
    if (!storedToken) {
      router.replace('/login');
    } else {
      setIsLoading(false);
    }
  }, [hydrate, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return null; // Will redirect in useEffect
  }

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
        {/* Fixed Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto">
          <Sidebar />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header /> {/* Contains User Dropdown & Mobile Menu Toggle */}
          
          <main className="flex-1 overflow-y-auto p-6 md:p-8 relative">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
