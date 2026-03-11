'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/use-permission';
import { Permission } from '@/lib/rbac/roles';
import {
  LayoutDashboard,
  Users,
  Star,
  ShoppingCart,
  Wallet,
  BarChart3,
  Shield,
  Activity,
  Video,
  ClipboardList,
  LogOut,
  Bell,
  Phone,
  MessageCircle,
  LucideIcon,
  Gift,
  IndianRupee,
  TrendingUp,
  RotateCcw,
  Flag,      // For Reports
  Ban,       // For Blocked Users
  Sparkles,  // For AI Services
  Database,  // For AI Logs
} from 'lucide-react';

// Define interface for menu items
interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  description?: string;
  requiredPermission?: Permission | string; // Allow string for flexibility if types aren't perfect yet
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuthStore();
  const { can } = usePermission();

  const menuCategories: MenuCategory[] = [
    {
      category: 'Main',
      items: [
        { 
          icon: LayoutDashboard, 
          label: 'Dashboard', 
          href: '/dashboard', 
          requiredPermission: 'view_dashboard' 
        },
      ],
    },
    {
      category: 'Management',
      items: [
        { 
          icon: Users, 
          label: 'Users', 
          href: '/users', 
          requiredPermission: 'view_users' 
        },
        { 
          icon: Star, 
          label: 'Astrologers', 
          href: '/astrologers', 
          requiredPermission: 'view_astrologers' 
        },
        { 
          icon: ClipboardList, 
          label: 'Interviews', 
          href: '/interviews', 
          requiredPermission: 'view_interviews' 
        },
        { 
          icon: Shield, 
          label: 'Admins', 
          href: '/admins', 
          requiredPermission: 'manage_admins',
        },
      ],
    },
    {
      category: 'Orders',
      items: [
        { 
          icon: ShoppingCart, 
          label: 'All Orders', 
          href: '/orders', 
          requiredPermission: 'view_orders' 
        },
        { 
          icon: Phone, 
          label: 'Call Traction', 
          href: '/orders/calls', 
          requiredPermission: 'view_orders' 
        },
        { 
          icon: MessageCircle, 
          label: 'Chat Traction', 
          href: '/orders/chats', 
          requiredPermission: 'view_orders' 
        },
      ],
    },
    {
      category: 'Finance',
      items: [
        {
          icon: IndianRupee,
          label: 'Transactions & Refunds',
          href: '/payments/transactions',
          requiredPermission: 'view_transactions',
        },
        {
          icon: TrendingUp,
          label: 'Payouts',
          href: '/payments/payouts',
          requiredPermission: 'manage_payouts', // changed from view_payouts to match typical admin needs
        },
        {
          icon: RotateCcw,
          label: 'Order Refunds',
          href: '/orders/refunds',
          requiredPermission: 'manage_refunds',
        },
        {
          icon: Gift,
          label: 'Gift Cards',
          href: '/payments/gift-cards',
          requiredPermission: 'manage_payments',
        },
        {
          icon: Wallet,
          label: 'Recharge Packs',
          href: '/offers/recharge-packs',
          requiredPermission: 'view_transactions',
        },
      ],
    },
    {
      category: 'Moderation & Comms',
      items: [
        {
          icon: Star,
          label: 'Reviews',
          href: '/reviews',
          requiredPermission: 'manage_reviews', // Fixed permission
        },
        { 
          icon: Video, 
          label: 'Livestreams', 
          href: '/livestreams', 
          requiredPermission: 'manage_livestreams' 
        },
      ],
    },
    {
      category: 'Trust & Safety', // <--- NEW PROFESSIONAL SECTION
      items: [
        { 
          icon: Flag, 
          label: 'User Reports', 
          href: '/moderation/reports', 
          requiredPermission: 'view_user_reports' 
        },
        { 
          icon: Ban, 
          label: 'Block List', 
          href: '/moderation/blocked', 
          requiredPermission: 'view_blocked_users' 
        },
      ],
    },
    {
      category: 'Communication', // Split Notifications here if you like, or keep in Moderation
      items: [
        { 
          icon: Bell, 
          label: 'Notifications', 
          href: '/notifications/manage', 
          requiredPermission: 'manage_notifications' 
        },
      ],
    },
    {
      category: 'AI Services',
      items: [
        {
          icon: Sparkles,
          label: 'AI Astrologers',
          href: '/ai-astrologers',
          requiredPermission: 'view_astrologers',
        },
        {
          icon: Database,
          label: 'AI Chat Logs',
          href: '/ai-chat-logs',
          requiredPermission: 'view_orders',
        },
      ],
    },
    {
      category: 'System',
      items: [
        { 
          icon: BarChart3, 
          label: 'Analytics', 
          href: '/analytics', 
          requiredPermission: 'view_analytics' 
        },
        {
          icon: BarChart3,
          label: 'Reports',
          href: '/reports',
          requiredPermission: 'view_reports',
        },
        { 
          icon: Activity, 
          label: 'Activity Logs', 
          href: '/activity-logs', 
          requiredPermission: 'view_logs' 
        },
      ],
    },
  ];

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen border-r border-gray-200 fixed left-0 top-0 overflow-y-auto z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">VaidikTalk</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-8">
        {menuCategories.map((category) => {
          // Filter items based on permissions
          const visibleItems = category.items.filter((item) => {
            if (!item.requiredPermission) return true;
            // @ts-ignore - Permission string check
            return can(item.requiredPermission);
          });

          // Hide empty categories
          if (visibleItems.length === 0) return null;

          return (
            <div key={category.category}>
              <p className="px-4 mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {category.category}
              </p>

              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.description}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                      )}
                      <Icon 
                        size={18} 
                        className={`transition-colors ${
                          isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`} 
                      />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer - Admin Info */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 sticky bottom-0">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border border-indigo-200 text-indigo-700 font-bold text-sm">
            {admin?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {admin?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {admin?.roleType?.replace(/_/g, ' ') || 'Administrator'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm border border-red-100 hover:border-red-200 group"
        >
          <LogOut size={16} className="group-hover:scale-110 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}