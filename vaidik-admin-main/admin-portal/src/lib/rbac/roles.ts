// src/lib/rbac/roles.ts

export type RoleType =
  | 'super_admin'
  | 'admin'
  | 'moderator'
  | 'support'
  | 'finance'
  | 'analyst'
  | 'content_manager';

export type Permission =
  // Dashboard
  | 'view_dashboard'
  | 'view_analytics'

  // Users
  | 'view_users'
  | 'manage_users'      // Edit, Block, Suspend
  | 'export_users'

  // Astrologers
  | 'view_astrologers'
  | 'manage_astrologers' // Approve, Reject, Suspend
  | 'manage_pricing'

  // Interviews
  | 'view_interviews'
  | 'conduct_interview'

  // Orders
  | 'view_orders'
  | 'manage_refunds'
  | 'cancel_orders'

  // Finance
  | 'view_transactions'
  | 'manage_payouts'

  // Content & Comms
  | 'manage_notifications'
  | 'manage_livestreams'
  | 'view_remedies'
  | 'view_shopify'

  | 'view_payments'
  | 'manage_payments'
  | 'view_payouts'
  | 'approve_payouts'
  | 'reject_payouts'
  | 'manage_refunds'

  | 'view_reports'
  | 'export_reports'

  | 'view_user_reports'    // For seeing flagged content/users
  | 'manage_user_reports'  // For resolving reports
  | 'view_blocked_users'
  // System
  | 'manage_admins'
  | 'create_admins'  // ✅ Add this
  | 'edit_admins'
  | 'delete_admins'
  | 'view_logs'
  | 'view_system_health'

  //support
  | 'support:tickets:view'
  | 'support:tickets:edit'
  | 'support:refund:process'
  | 'support:payout:approve'
  | 'support:stats:view'


export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  super_admin: [
    // Has Access to EVERYTHING (handled in hook logic, but listed here for reference)
    'view_dashboard', 'view_analytics',
    'view_users', 'manage_users', 'export_users',
    'view_astrologers', 'manage_astrologers', 'manage_pricing',
    'view_interviews', 'conduct_interview',
    'view_orders', 'manage_refunds', 'cancel_orders',
    'view_transactions', 'manage_payouts',
    'manage_notifications', 'manage_livestreams', 'view_remedies', 'view_shopify',
    'manage_admins', 'view_logs', 'view_system_health', 'support:tickets:view',
    'support:tickets:edit',
    'support:refund:process',
    'support:payout:approve',
    'support:stats:view', 'view_user_reports', 'manage_user_reports', 'view_blocked_users'
  ],
  admin: [
    'view_dashboard', 'view_analytics',
    'view_users', 'manage_users',
    'view_astrologers', 'manage_astrologers',
    'view_interviews', 'conduct_interview',
    'view_orders', 'manage_refunds',
    'manage_notifications', 'manage_livestreams', 'view_remedies', 'view_shopify',
    'view_logs', 'support:tickets:view',
    'support:tickets:edit',
    'support:refund:process',
    'support:payout:approve',
    'support:stats:view',
    'view_user_reports', 'manage_user_reports', 'view_blocked_users'
  ],
  moderator: [
    'view_dashboard',
    'view_users', 'manage_users', // Can block bad users
    'view_astrologers', 'manage_astrologers',
    'manage_livestreams', // Can force end bad streams
    'manage_notifications',
    'view_user_reports', 'manage_user_reports', 'view_blocked_users'
  ],
  support: [
    'view_dashboard',
    'view_users',
    'view_orders', // Need to see orders to help
    'view_transactions', 'support:tickets:view',
    'support:tickets:edit',
    'support:refund:process',
    'support:payout:approve',
    'support:stats:view'
  ],
  finance: [
    'view_dashboard', 'view_analytics',
    'view_orders', 'manage_refunds',
    'view_transactions', 'manage_payouts', 'support:tickets:view',
    'support:tickets:edit',
    'support:refund:process',
    'support:payout:approve',
    'support:stats:view'
  ],
  analyst: [
    'view_dashboard', 'view_analytics',
    'view_users', 'view_astrologers', 'view_orders',
    'view_remedies', 'view_shopify', 'support:tickets:view',
    'support:stats:view'
  ],
  content_manager: [
    'view_dashboard',
    'manage_notifications',
    'view_remedies', 'view_shopify'
  ]
};
