// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { usePermission } from '@/hooks/use-permission'; // ✅ Import our new hook
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
  ShoppingBag,
  Sparkles,
  Server,
  Headphones, // ✅ For Support
  LucideIcon,
  RefreshCw,
  Gift,
  DollarSign,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';

// Define interface for menu items
interface MenuItem {
  icon: LucideIcon;
  label: string;
  href: string;
  description?: string;
  requiredPermission?: Permission; // ✅ Permission key
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

// ✅ Menu Structure Mapped to Permissions
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
  label: 'Reviews',
  href: '/reviews',
  icon: Star,
  requiredPermission: 'view_astrologers' // Optional: show pending count
},
      { 
        icon: Video, 
        label: 'Livestreams', 
        href: '/livestreams', 
        requiredPermission: 'manage_livestreams' 
      },
      { 
        icon: ClipboardList, 
        label: 'Interviews', 
        href: '/interviews', 
        requiredPermission: 'view_interviews' 
      },
      { 
        icon: ShoppingCart, 
        label: 'Orders', 
        href: '/orders', 
        requiredPermission: 'view_orders' 
      },
    ],
  },
  {
    category: 'Monitoring',
    items: [
      {
        icon: ShoppingBag,
        label: 'Shopify Orders',
        href: '/shopify-orders',
        requiredPermission: 'view_shopify',
      },
      {
        icon: Sparkles,
        label: 'Remedies',
        href: '/remedies',
        requiredPermission: 'view_remedies',
      },
      {
        icon: Server,
        label: 'System Health',
        href: '/system-health',
        requiredPermission: 'view_system_health',
      },
    ],
  },
  {
    category: 'Finance',
    items: [
      { 
        icon: Wallet, 
        label: 'Payments', 
        href: '/payments/transactions', 
        requiredPermission: 'view_transactions' 
      },
      {
        icon: RefreshCw,
        label: 'Refunds',
        href: '/orders/refunds',
        requiredPermission: 'manage_refunds',
      },

    ],
  },
  {
    category: 'Communication',
    items: [
      { 
        icon: Bell, 
        label: 'Notifications', 
        href: '/notifications/manage', 
        requiredPermission: 'manage_notifications' 
      },
      { 
  href: '/notifications/test-types', 
  label: 'Test Types', 
  icon: Bell,
  requiredPermission: 'manage_notifications'
},
      {
        icon: Headphones,
        label: 'Support Tickets',
        href: '/support/tickets',
        requiredPermission: 'manage_users', // Support usually needs user mgmt
      }
    ],
  },
  {
  category: 'Payments',
  items: [
    {
      icon: DollarSign,
      label: 'Transactions',
      href: '/payments/transactions',
      requiredPermission: 'view_payments',
    },
    {
      icon: TrendingUp,
      label: 'Payouts',
      href: '/payments/payouts',
      requiredPermission: 'view_payouts',
    },
    {
      icon: RefreshCw,
      label: 'Wallet Refunds',
      href: '/payments/wallet-refunds',
      requiredPermission: 'view_payments',
    },
    {
      icon: Gift,
      label: 'Gift Cards',
      href: '/payments/gift-cards',
      requiredPermission: 'view_payments',
    },
    {
      icon: RotateCcw,
      label: 'Order Refunds',
      href: '/orders/refunds',
      requiredPermission: 'manage_refunds',
    },
  ],
},
  {
    category: 'Administration',
    items: [
      { 
        icon: BarChart3, 
        label: 'Analytics', 
        href: '/analytics', 
        requiredPermission: 'view_analytics' 
      },
      {
        icon: Shield,
        label: 'Admins',
        href: '/admins',
        requiredPermission: 'manage_admins',
      },
      { 
        icon: Activity, 
        label: 'Activity Logs', 
        href: '/activity-logs', 
        requiredPermission: 'view_logs' 
      },
      {
  icon: BarChart3,
  label: 'Reports',
  href: '/reports',
  requiredPermission: 'view_reports',
},
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuthStore();
  const { can } = usePermission(); // ✅ Use the hook

  return (
    <div className="w-64 bg-white shadow-lg flex flex-col h-screen border-r border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">VaidikTalk</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {menuCategories.map((category) => {
          // Filter items based on permissions
          const visibleItems = category.items.filter((item) => {
            if (!item.requiredPermission) return true;
            return can(item.requiredPermission);
          });

          // Hide empty categories
          if (visibleItems.length === 0) return null;

          return (
            <div key={category.category}>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {category.category}
              </p>

              <div className="space-y-1 mt-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href || pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.description}
                      className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className={`transition-colors ${
                          isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`} 
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer - Admin Info */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 border border-indigo-200">
            <span className="text-indigo-700 font-semibold text-sm">
              {admin?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {admin?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 capitalize truncate">
              {admin?.roleType?.replace(/_/g, ' ') || 'Role'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-sm border border-transparent hover:border-red-100"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
