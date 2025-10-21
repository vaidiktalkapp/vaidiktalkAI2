'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Star, 
  ShoppingCart, 
  Wallet,
  BarChart3,
  Shield,
  Activity,
  Video, // ✅ NEW
  ClipboardList, // ✅ NEW
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Users', href: '/users' },
  { icon: Star, label: 'Astrologers', href: '/astrologers' },
  { icon: Video, label: 'Livestreams', href: '/livestreams' }, // ✅ NEW
  { icon: ClipboardList, label: 'Interviews', href: '/interviews' }, // ✅ NEW
  { icon: ShoppingCart, label: 'Orders', href: '/orders' },
  { icon: Wallet, label: 'Payments', href: '/payments/transactions' },
  { icon: BarChart3, label: 'Analytics', href: '/analytics' },
  { icon: Shield, label: 'Admins', href: '/admins', requiredPermission: 'ADMINS_VIEW' },
  { icon: Activity, label: 'Activity Logs', href: '/activity-logs' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuthStore();

  // Check if admin has permission
  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (admin?.roleType === 'super_admin') return true;
    return admin?.permissions?.includes(permission);
  };

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-indigo-600">VaidikTalk</h1>
        <p className="text-sm text-gray-600">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto"> {/* ✅ Added overflow-y-auto */}
        {menuItems.map((item) => {
          // Skip menu item if user doesn't have permission
          if (!hasPermission(item.requiredPermission)) {
            return null;
          }

          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href);
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-indigo-600 font-semibold">
              {admin?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{admin?.name}</p>
            <p className="text-xs text-gray-500">{admin?.roleType}</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
