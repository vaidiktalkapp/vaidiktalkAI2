// src/components/layout/Header.tsx
'use client';

import NotificationBell from '@/components/notifications/NotificationBell';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
          </div>
        </div>

        <div className="flex items-center space-x-4">
            <NotificationBell />
        </div>
      </div>
    </header>
  );
}
