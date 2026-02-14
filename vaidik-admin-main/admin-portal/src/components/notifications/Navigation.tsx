// components/Navigation.tsx (UPDATED - Complete Navigation)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    { 
      href: '/', 
      label: 'Dashboard', 
      icon: '📊',
      category: 'main'
    },
    // Notification items
    { 
      href: '/notifications', 
      label: 'All Notifications', 
      icon: '🔔',
      category: 'notifications'
    },
    { 
      href: '/notifications/broadcast', 
      label: 'Broadcast', 
      icon: '📢',
      category: 'notifications'
    },
    { 
      href: '/notifications/schedule', 
      label: 'Schedule', 
      icon: '⏰',
      category: 'notifications'
    },
    { 
      href: '/notifications/scheduled', 
      label: 'Scheduled', 
      icon: '📅',
      category: 'notifications'
    },
    { 
      href: '/notifications/manage', 
      label: 'Manage', 
      icon: '⚙️',
      category: 'notifications'
    },
    { 
      href: '/notifications/analytics', 
      label: 'Analytics', 
      icon: '📈',
      category: 'notifications'
    },
  ];

  const mainItems = navItems.filter(item => item.category === 'main');
  const notificationItems = navItems.filter(item => item.category === 'notifications');

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Main Navigation */}
          <div className="flex items-center gap-4">
            {mainItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive(item.href)
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Notification Sub-Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {notificationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium whitespace-nowrap rounded-full transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
