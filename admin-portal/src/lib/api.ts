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
    apiClient.post('/admin/auth/login', { email, password }),
  
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
  
  updateUserStatus: (userId: string, status: string) =>
    apiClient.patch(`/admin/users/${userId}/status`, { status }),

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
   * Get pending astrologers (waitlist) - Maps to registrations/waitlist
   */
  getPendingAstrologers: (params: { page?: number; limit?: number }) =>
    apiClient.get('/admin/registrations/waitlist', { params }),
  
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
   * Update astrologer pricing
   */
  updateAstrologerPricing: (astrologerId: string, pricing: { chat: number; call: number; videoCall: number }) =>
    apiClient.patch(`/admin/astrologers/${astrologerId}/pricing`, pricing),
  
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

  // Payments
  getAllTransactions: (params: any) =>
    apiClient.get('/admin/payments/transactions', { params }),
  
  getTransactionStats: () =>
    apiClient.get('/admin/payments/transactions/stats'),
  
  getAllPayouts: (params: any) =>
    apiClient.get('/admin/payments/payouts', { params }),
  
  getPendingPayouts: () =>
    apiClient.get('/admin/payments/payouts/pending'),
  
  getPayoutStats: () =>
    apiClient.get('/admin/payments/payouts/stats'),
  
  getPayoutDetails: (payoutId: string) =>
    apiClient.get(`/admin/payments/payouts/${payoutId}`),
  
  approvePayout: (payoutId: string, data: any) =>
    apiClient.post(`/admin/payments/payouts/${payoutId}/approve`, data),
  
  rejectPayout: (payoutId: string, reason: string) =>
    apiClient.post(`/admin/payments/payouts/${payoutId}/reject`, { reason }),

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
};
