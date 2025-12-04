import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post('/admin/auth/login', { 
      email: email.trim(),      // Remove whitespace
      password: password.trim() // Remove whitespace
    }),
  
  getProfile: () =>
    apiClient.get('/admin/auth/profile'),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    apiClient.post('/admin/auth/change-password', { oldPassword, newPassword }),

  // Analytics
  getDashboardStats: () =>
    apiClient.get('/admin/analytics/dashboard'),
  
  getRevenueAnalytics: (startDate: string, endDate: string) =>
    apiClient.get('/admin/analytics/revenue', { params: { startDate, endDate } }),
  
  getTopAstrologers: (limit: number = 10) =>
    apiClient.get('/admin/analytics/top-astrologers', { params: { limit } }),
  
  getUserGrowth: (startDate: string, endDate: string) =>
    apiClient.get('/admin/analytics/user-growth', { params: { startDate, endDate } }),

  // Users
  getAllUsers: (params: any) =>
    apiClient.get('/admin/users', { params }),
  
  getUserStats: () =>
    apiClient.get('/admin/users/stats'),
  
  getUserDetails: (userId: string) =>
    apiClient.get(`/admin/users/${userId}`),
  

  // ==================== REGISTRATIONS (NEW) ====================
  
  /**
   * Get all registrations (waitlist, interviews, approved, rejected)
   */
  getAllRegistrations: (params: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get('/admin/registrations', { params }),

  /**
   * Get waitlist registrations
   */
  getWaitlist: (params: { page?: number; limit?: number }) =>
    apiClient.get('/admin/registrations/waitlist', { params }),

  /**
   * Get registration details
   */
  getRegistrationDetails: (registrationId: string) =>
    apiClient.get(`/admin/registrations/${registrationId}`),

  /**
   * Shortlist candidate from waitlist (move to interview round 1)
   */
  shortlistCandidate: (registrationId: string, notes?: string) =>
    apiClient.post(`/admin/registrations/${registrationId}/shortlist`, { notes }),

  /**
   * Complete interview round
   */
  completeInterviewRound: (
    registrationId: string,
    round: number,
    data: {
      passed: boolean;
      rating?: number;
      notes?: string;
      callDuration?: number;
      callSessionId?: string;
    }
  ) =>
    apiClient.post(`/admin/registrations/${registrationId}/interview/${round}/complete`, data),

  /**
   * Reject registration
   */
  rejectRegistration: (registrationId: string, reason: string, canReapply: boolean = false) =>
    apiClient.post(`/admin/registrations/${registrationId}/reject`, { reason, canReapply }),

  /**
   * Get registration stats
   */
  getRegistrationStats: () =>
    apiClient.get('/admin/registrations/stats/summary'),

  // ==================== ASTROLOGERS ====================
  
  /**
   * Get all astrologers (approved profiles)
   */
  getAllAstrologers: (params: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get('/admin/astrologers', { params }),
  
  /**
   * Get astrologer stats
   */
  getAstrologerStats: () =>
    apiClient.get('/admin/astrologers/stats'),
  
  
  /**
   * Get astrologer details
   */
  getAstrologerDetails: (astrologerId: string) =>
    apiClient.get(`/admin/astrologers/${astrologerId}`),
  
  /**
   * Approve astrologer (shortlist from waitlist)
   */
  approveAstrologer: (registrationId: string, adminNotes?: string) =>
    apiClient.post(`/admin/registrations/${registrationId}/shortlist`, { notes: adminNotes }),
  
  /**
   * Reject astrologer application
   */
  rejectAstrologer: (registrationId: string, reason: string) =>
    apiClient.post(`/admin/registrations/${registrationId}/reject`, { reason, canReapply: false }),
  
  /**
   * Update astrologer account status (active/inactive/suspended)
   */
  updateAstrologerStatus: (astrologerId: string, status: string, reason?: string) =>
    apiClient.patch(`/admin/astrologers/${astrologerId}/status`, { status, reason }),
  
  /**
   * Suspend astrologer
   */
  suspendAstrologer: (astrologerId: string, reason: string) =>
    apiClient.post(`/admin/astrologers/${astrologerId}/suspend`, { reason }),

  /**
   * Activate astrologer
   */
  activateAstrologer: (astrologerId: string) =>
    apiClient.post(`/admin/astrologers/${astrologerId}/activate`),
  
  
  /**
   * Update astrologer bio
   */
  updateAstrologerBio: (astrologerId: string, bio: string) =>
    apiClient.patch(`/admin/astrologers/${astrologerId}/bio`, { bio }),

  // Orders
  getAllOrders: (params: any) =>
    apiClient.get('/admin/orders', { params }),
  
  getOrderStats: () =>
    apiClient.get('/admin/orders/stats'),
  
  getOrderDetails: (orderId: string) =>
    apiClient.get(`/admin/orders/${orderId}`),
  
  refundOrder: (orderId: string, data: any) =>
    apiClient.post(`/admin/orders/${orderId}/refund`, data),
  
  cancelOrder: (orderId: string, reason: string) =>
    apiClient.patch(`/admin/orders/${orderId}/cancel`, { reason }),
  

  // Admin Management
  getAllAdmins: (params?: any) =>
    apiClient.get('/admin/admins', { params }),
  
  createAdmin: (data: any) =>
    apiClient.post('/admin/auth/create-admin', data),

  // Activity Logs
  getActivityLogs: (params?: any) =>
    apiClient.get('/admin/activity-logs', { params }),

  // ==================== LIVESTREAM ENDPOINTS ====================

  /**
   * Get all streams
   */
  getAllStreams: (params: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get('/admin/streams', { params }),

  /**
   * Get stream statistics
   */
  getStreamStats: () =>
    apiClient.get('/admin/streams/stats'),

  /**
   * Get currently live streams
   */
  getLiveStreams: (params: { page?: number; limit?: number }) =>
    apiClient.get('/admin/streams/live', { params }),

  /**
   * Get stream details
   */
  getStreamDetails: (streamId: string) =>
    apiClient.get(`/admin/streams/${streamId}`),

  /**
   * Get viewer token for admin to watch stream
   */
  getViewerToken: (streamId: string) =>
    apiClient.get(`/admin/streams/${streamId}/viewer-token`),

  /**
   * Force end stream
   */
  forceEndStream: (streamId: string, reason: string) =>
    apiClient.post(`/admin/streams/${streamId}/force-end`, { reason }),

  /**
   * Get stream analytics
   */
  getStreamAnalytics: (streamId: string) =>
    apiClient.get(`/admin/streams/${streamId}/analytics`),

  /**
   * Get top performing streams
   */
  getTopStreams: (limit: number = 10) =>
    apiClient.get('/admin/streams/analytics/top-streams', { params: { limit } }),

  /**
   * Get top earning astrologers from streams
   */
  getTopStreamEarners: (limit: number = 10) =>
    apiClient.get('/admin/streams/analytics/top-earners', { params: { limit } }),

  
 // ==================== NOTIFICATIONS ====================

  /**
   * Broadcast notification to all users
   */
  broadcastToAllUsers: (payload: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    imageUrl?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) =>
    apiClient.post('/admin/notifications/broadcast/all-users', payload),

  /**
   * Broadcast notification to specific users
   */
  broadcastToSpecificUsers: (payload: {
    userIds: string[];
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    imageUrl?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }) =>
    apiClient.post('/admin/notifications/broadcast/specific-users', payload),

  /**

Send full-screen notification to a single User or Astrologer
*/
sendFullScreenNotification: (payload: {
recipientId: string;
recipientModel: 'User' | 'Astrologer';
type: string;
title: string;
message: string;
data?: Record<string, any>;
imageUrl?: string;
actionUrl?: string;
}) =>
apiClient.post('/admin/notifications/send/fullscreen', payload),


  /**
   * Notify astrologer's followers (for livestream notifications)
   */
  notifyFollowers: (astrologerId: string, payload: {
    type: 'stream_started' | 'stream_reminder';
    title: string;
    message: string;
    data?: Record<string, any>;
    imageUrl?: string;
    actionUrl?: string;
  }) =>
    apiClient.post(`/admin/notifications/notify-followers/${astrologerId}`, payload),

  /**
   * Schedule notification for future delivery
   */
  scheduleNotification: (payload: {
    scheduledFor: string; // ISO date string
    type: string;
    title: string;
    message: string;
    data?: Record<string, any>;
    imageUrl?: string;
    actionUrl?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    recipientType: 'all_users' | 'all_astrologers' | 'specific_users' | 'followers';
    specificRecipients?: string[];
    astrologerId?: string;
  }) =>
    apiClient.post('/admin/notifications/schedule', payload),

  /**
   * Get all scheduled notifications
   */
  getScheduledNotifications: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    apiClient.get('/admin/notifications/scheduled', { params }),

  /**
   * Get upcoming scheduled notifications (next 24 hours)
   */
  getUpcomingNotifications: () =>
    apiClient.get('/admin/notifications/scheduled/upcoming'),

  /**
   * Get scheduled notification by ID
   */
  getScheduledNotificationById: (scheduleId: string) =>
    apiClient.get(`/admin/notifications/scheduled/${scheduleId}`),

  /**
   * Cancel scheduled notification
   */
  cancelScheduledNotification: (scheduleId: string) =>
    apiClient.delete(`/admin/notifications/scheduled/${scheduleId}`),

  /**
   * Get notification statistics
   */
  getNotificationStats: () =>
    apiClient.get('/admin/notifications/stats'),

  /**
   * Get real-time connection statistics
   */
  getNotificationConnectionStats: () =>
    apiClient.get('/admin/notifications/stats/connections'),

  /**
   * Check if specific user is online
   */
  checkUserOnline: (userId: string) =>
    apiClient.get(`/admin/notifications/check-online/${userId}`),

  /**
   * Test admin notification (Socket.io)
   */
  testNotification: () =>
    apiClient.post('/admin/notifications/test'),

  /**
   * Broadcast system alert to all admins
   */
  sendSystemAlert: (payload: {
    message: string;
    data?: any;
  }) =>
    apiClient.post('/admin/notifications/system-alert', payload),

  
  // ==================== SHOPIFY ORDERS ====================

/**
 * Get all synced Shopify orders
 */
getAllShopifyOrders: (params: { page?: number; limit?: number }) =>
  apiClient.get('/admin/shopify-orders', { params }),

/**
 * Get Shopify orders by status (paid, pending, fulfilled, etc.)
 */
getShopifyOrdersByStatus: (status: string, params: { page?: number; limit?: number }) =>
  apiClient.get(`/admin/shopify-orders/status/${status}`, { params }),

/**
 * Search Shopify orders
 */
searchShopifyOrders: (query: string, params: { page?: number; limit?: number }) =>
  apiClient.get('/admin/shopify-orders/search', { params: { query, ...params } }),

/**
 * Get Shopify orders statistics
 */
getShopifyOrdersStats: () =>
  apiClient.get('/admin/shopify-orders/stats'),

// ==================== REMEDIES ====================

/**
 * Get all remedies
 */
getAllRemedies: (params: { page?: number; limit?: number; source?: string; status?: string }) =>
  apiClient.get('/admin/remedies', { params }),

/**
 * Get remedies by source (manual or shopify_product)
 */
getRemediesBySource: (source: string, params: { page?: number; limit?: number }) =>
  apiClient.get(`/admin/remedies/source/${source}`, { params }),

/**
 * Get remedies by status
 */
getRemediesByStatus: (status: string, params: { page?: number; limit?: number }) =>
  apiClient.get(`/admin/remedies/status/${status}`, { params }),

/**
 * Get remedies statistics
 */
getRemediesStats: () =>
  apiClient.get('/admin/remedies/stats'),

/**
 * Get purchase conversion tracking
 */
getPurchaseConversionTracking: () =>
  apiClient.get('/admin/remedies/conversion-tracking'),

// ==================== ASTROLOGER PERFORMANCE ====================

/**
 * Get astrologer performance metrics
 */
getAstrologerPerformance: (astrologerId: string) =>
  apiClient.get(`/admin/astrologers/${astrologerId}/performance`),

// ==================== ORDER & REMEDY LINKING ====================

/**
 * Get order with all suggested remedies
 */
getOrderWithRemedies: (orderId: string) =>
  apiClient.get(`/admin/orders/${orderId}/with-remedies`),

/**
 * Get user's complete journey
 */
getUserJourney: (userId: string) =>
  apiClient.get(`/admin/users/${userId}/journey`),

// ==================== SYSTEM HEALTH ====================

/**
 * Get system health and sync status
 */
getSystemHealth: () =>
  apiClient.get('/admin/health'),
  
// ==================== USERS (EXTENDED) ====================

/**
 * Update user status with reason
 */
updateUserStatus: (userId: string, status: string, reason?: string) =>
  apiClient.patch(`/admin/users/${userId}/status`, { status, reason }),

/**
 * Get user activity (orders, transactions, favorites)
 */
getUserActivity: (userId: string) =>
  apiClient.get(`/admin/users/${userId}/activity`),

/**
 * Get user wallet transactions
 */
getUserTransactions: (userId: string, page: number = 1, limit: number = 20) =>
  apiClient.get(`/admin/users/${userId}/transactions`, { params: { page, limit } }),

/**
 * Get user orders
 */
getUserOrders: (userId: string, page: number = 1, limit: number = 20) =>
  apiClient.get(`/admin/users/${userId}/orders`, { params: { page, limit } }),

/**
 * Adjust user wallet balance (admin credit/debit)
 */
adjustWalletBalance: (userId: string, amount: number, reason: string) =>
  apiClient.patch(`/admin/users/${userId}/wallet/adjust`, { amount, reason }),

/**
 * Search users
 */
searchUsers: (query: string, page: number = 1, limit: number = 20) =>
  apiClient.get('/admin/users/search', { params: { query, page, limit } }),

/**
 * Get active users count
 */
getActiveUsers: () =>
  apiClient.get('/admin/users/active-now'),

/**
 * Delete user (soft delete)
 */
deleteUser: (userId: string, reason?: string) =>
  apiClient.delete(`/admin/users/${userId}`, { data: { reason } }),

/**
 * Restore deleted user
 */
restoreUser: (userId: string) =>
  apiClient.patch(`/admin/users/${userId}/restore`),

/**
 * Export users to CSV
 */
exportUsersCSV: (status?: string) =>
  apiClient.get('/admin/users/export/csv', { params: { status } }),

// ==================== ASTROLOGERS (EXTENDED) ====================

/**
 * Get pending astrologers (incomplete profiles)
 */
getPendingAstrologers: (page: number = 1, limit: number = 50) =>
  apiClient.get('/admin/astrologers/pending', { params: { page, limit } }),

/**
 * Get top performing astrologers
 */
getTopPerformingAstrologers: (limit: number = 10) =>
  apiClient.get('/admin/astrologers/top-performers', { params: { limit } }),


/**
 * Update astrologer pricing
 */
updateAstrologerPricing: (astrologerId: string, pricing: { 
  chatRatePerMinute?: number; 
  callRatePerMinute?: number; 
  videoCallRatePerMinute?: number;
}) =>
  apiClient.patch(`/admin/astrologers/${astrologerId}/pricing`, pricing),


/**
 * Toggle astrologer features (chat/call/livestream)
 */
toggleAstrologerFeatures: (astrologerId: string, features: {
  isChatEnabled?: boolean;
  isCallEnabled?: boolean;
  isLiveStreamEnabled?: boolean;
}) =>
  apiClient.patch(`/admin/astrologers/${astrologerId}/features`, features),

/**
 * Delete astrologer (soft delete)
 */
deleteAstrologer: (astrologerId: string, reason?: string) =>
  apiClient.delete(`/admin/astrologers/${astrologerId}`, { data: { reason } }),

// ==================== REFUNDS ====================

/**
 * Get all refund requests
 */
getAllRefundRequests: (page: number = 1, limit: number = 20, status?: string) =>
  apiClient.get('/admin/orders/refunds/all', { params: { page, limit, status } }),

/**
 * Get pending refund requests
 */
getPendingRefundRequests: (page: number = 1, limit: number = 20) =>
  apiClient.get('/admin/orders/refunds/pending', { params: { page, limit } }),

/**
 * Get refund statistics
 */
getRefundStats: () =>
  apiClient.get('/admin/orders/refunds/stats'),

// ==================== PAYMENTS & TRANSACTIONS ====================

/**
 * Get all wallet transactions
 */
getAllTransactions: (params: { page?: number; limit?: number; type?: string; status?: string; userId?: string }) =>
  apiClient.get('/admin/payments/transactions', { params }),

/**
 * Get transaction statistics
 */
getTransactionStats: () =>
  apiClient.get('/admin/payments/transactions/stats'),

// ==================== PAYOUTS ====================

/**
 * Get all payout requests
 */
getAllPayouts: (params: { page?: number; limit?: number; status?: string }) =>
  apiClient.get('/admin/payments/payouts', { params }),

/**
 * Get pending payouts
 */
getPendingPayouts: () =>
  apiClient.get('/admin/payments/payouts/pending'),

/**
 * Get payout statistics
 */
getPayoutStats: () =>
  apiClient.get('/admin/payments/payouts/stats'),

/**
 * Process payout (mark as processing)
 */
processPayout: (payoutId: string, data: { transactionReference?: string; adminNotes?: string }) =>
  apiClient.post(`/admin/payments/payouts/${payoutId}/process`, data),

/**
 * Complete payout
 */
completePayout: (payoutId: string, data: { transactionReference: string; adminNotes?: string }) =>
  apiClient.post(`/admin/payments/payouts/${payoutId}/complete`, data),


/**
 * Get payout details
 */
getPayoutDetails: (payoutId: string) =>
  apiClient.get(`/admin/payments/payouts/${payoutId}`),

/**
 * Approve payout
 */
approvePayout: (payoutId: string, data: { transactionReference: string; adminNotes?: string }) =>
  apiClient.post(`/admin/payments/payouts/${payoutId}/approve`, data),

/**
 * Reject payout
 */
rejectPayout: (payoutId: string, reason: string) =>
  apiClient.post(`/admin/payments/payouts/${payoutId}/reject`, { reason }),

// ==================== WALLET REFUNDS ====================

/**
 * Get wallet refund requests
 */
getWalletRefundRequests: (params: { page?: number; limit?: number; status?: string; userId?: string }) =>
  apiClient.get('/admin/payments/wallet-refunds', { params }),

/**
 * Get wallet refund details
 */
getWalletRefundDetails: (refundId: string) =>
  apiClient.get(`/admin/payments/wallet-refunds/${refundId}`),

/**
 * Process wallet refund
 */
processWalletRefund: (refundId: string, data: { amountApproved: number; paymentReference: string }) =>
  apiClient.post(`/admin/payments/wallet-refunds/${refundId}/process`, data),

// ==================== GIFT CARDS ====================

/**
 * Get all gift cards
 */
getAllGiftCards: (params: { page?: number; limit?: number; status?: string; search?: string }) =>
  apiClient.get('/admin/payments/gift-cards', { params }),

/**
 * Get gift card details
 */
getGiftCardDetails: (code: string) =>
  apiClient.get(`/admin/payments/gift-cards/${code}`),

/**
 * Create gift card
 */
createGiftCard: (data: {
  code: string;
  amount: number;
  currency?: string;
  maxRedemptions?: number;
  expiresAt?: string;
  metadata?: Record<string, any>;
}) =>
  apiClient.post('/admin/payments/gift-cards', data),

/**
 * Update gift card status
 */
updateGiftCardStatus: (code: string, status: 'active' | 'disabled' | 'expired') =>
  apiClient.patch(`/admin/payments/gift-cards/${code}/status`, { status }),

// ==================== REPORTS & ANALYTICS ====================

/**
 * Get revenue report
 */
getRevenueReport: (startDate: string, endDate: string, groupBy?: string) =>
  apiClient.get('/admin/reports/revenue', { params: { startDate, endDate, groupBy } }),

/**
 * Get user growth report
 */
getUserGrowthReport: (startDate: string, endDate: string) =>
  apiClient.get('/admin/reports/users', { params: { startDate, endDate } }),

/**
 * Get astrologer performance report
 */
getAstrologerPerformanceReport: (startDate: string, endDate: string, limit?: number) =>
  apiClient.get('/admin/reports/astrologers', { params: { startDate, endDate, limit } }),

/**
 * Get orders report
 */
getOrdersReport: (startDate: string, endDate: string) =>
  apiClient.get('/admin/reports/orders', { params: { startDate, endDate } }),

/**
 * Get payments report
 */
getPaymentsReport: (startDate: string, endDate: string) =>
  apiClient.get('/admin/reports/payments', { params: { startDate, endDate } }),

/**
 * Get dashboard summary
 */
getDashboardSummary: (startDate?: string, endDate?: string) =>
  apiClient.get('/admin/reports/dashboard-summary', { params: { startDate, endDate } }),

/**
 * Export revenue report (CSV)
 */
exportRevenueReport: (startDate: string, endDate: string) =>
  apiClient.get('/admin/reports/export/revenue', { 
    params: { startDate, endDate },
    responseType: 'blob',
  }),

/**
 * Export users report (CSV)
 */
exportUsersReport: (status?: string) =>
  apiClient.get('/admin/reports/export/users', { 
    params: { status },
    responseType: 'blob',
  }),

/**
 * Export astrologers report (CSV)
 */
exportAstrologersReport: () =>
  apiClient.get('/admin/reports/export/astrologers', { 
    responseType: 'blob',
  }),

/**
 * Export orders report (CSV)
 */
exportOrdersReport: (startDate: string, endDate: string) =>
  apiClient.get('/admin/reports/export/orders', { 
    params: { startDate, endDate },
    responseType: 'blob',
  }),

  // ==================== REVIEWS & RATINGS ====================

/**
 * Get reviews for moderation
 */
getReviews: (params: { status?: string; page?: number; limit?: number }) =>
  apiClient.get('/admin/reviews', { params }),

/**
 * Get review moderation statistics
 */
getReviewStats: () =>
  apiClient.get('/admin/reviews/stats'),

/**
 * Approve a review
 */
approveReview: (orderId: string) =>
  apiClient.patch(`/admin/reviews/${orderId}/approve`),

/**
 * Reject a review
 */
rejectReview: (orderId: string, reason: string) =>
  apiClient.patch(`/admin/reviews/${orderId}/reject`, { reason }),

/**
 * Flag a review for manual review
 */
flagReview: (orderId: string, reason: string) =>
  apiClient.patch(`/admin/reviews/${orderId}/flag`, { reason }),

// Call Notification
sendCallNotification: async (data: {
  recipientId: string;
  recipientModel: 'User' | 'Astrologer';
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  isVideo: boolean;
  callId: string;
  roomId?: string;
}) => {
  return apiClient.post('/admin/notifications/send/call', data);
},

// Message Notification
sendMessageNotification: async (data: {
  recipientId: string;
  recipientModel: 'User' | 'Astrologer';
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messageText: string;
  chatId: string;
  messageId: string;
}) => {
  return apiClient.post('/admin/notifications/send/message', data);
},

// Live Event Notification
sendLiveEventNotification: async (data: {
  recipientId: string;
  recipientModel: 'User' | 'Astrologer';
  eventId: string;
  eventName: string;
  eventType: 'started' | 'reminder';
  eventStartTime?: string;
  astrologerId?: string;
  astrologerName?: string;
  astrologerAvatar?: string;
}) => {
  return apiClient.post('/admin/notifications/send/live-event', data);
},

// System Notification
sendSystemNotification: async (data: {
  recipientId: string;
  recipientModel: 'User' | 'Astrologer';
  title: string;
  message: string;
  imageUrl?: string;
  actionUrl?: string;
  data?: Record<string, any>;
}) => {
  return apiClient.post('/admin/notifications/send/system', data);
},

// Force Logout
forceLogoutUser: async (data: {
  recipientId: string;
  recipientModel: 'User' | 'Astrologer';
  reason: string;
}) => {
  return apiClient.post('/admin/notifications/force-logout', data);
},

// ===== SUPPORT TICKETS =====
  getAllSupportTickets: (params: {
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    userType?: string;
    search?: string;
  }) => apiClient.get('/admin/support/tickets', { params }),

  getSupportTicketDetails: (ticketId: string) =>
    apiClient.get(`/admin/support/tickets/${ticketId}`),

  getSupportStats: () =>
    apiClient.get('/admin/support/tickets/stats'),

  processRefund: (ticketId: string, data: {
    amount: number;
    refundType: 'gateway' | 'wallet';
    reason: string;
  }) => apiClient.post(`/admin/support/tickets/${ticketId}/process-refund`, data),

  approvePayoutsupport: (ticketId: string, data: { notes?: string }) =>
    apiClient.post(`/admin/support/tickets/${ticketId}/approve-payout`, data),

  rejectRefund: (ticketId: string, data: { reason: string }) =>
    apiClient.post(`/admin/support/tickets/${ticketId}/reject-refund`, data),

  rejectPayoutsupport: (ticketId: string, data: { reason: string }) =>
    apiClient.post(`/admin/support/tickets/${ticketId}/reject-payout`, data),

  updateTicketStatus: (ticketId: string, data: { status: string; notes?: string }) =>
    apiClient.post(`/admin/support/tickets/${ticketId}/status`, data),

  addInternalNote: (ticketId: string, data: { note: string }) =>
    apiClient.post(`/admin/support/tickets/${ticketId}/add-note`, data),

};
