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

  // Astrologers
  getAllAstrologers: (params: any) =>
    apiClient.get('/admin/astrologers', { params }),
  
  getAstrologerStats: () =>
    apiClient.get('/admin/astrologers/stats'),
  
  getPendingAstrologers: (params: any) =>
    apiClient.get('/admin/astrologers/pending', { params }),
  
  getAstrologerDetails: (astrologerId: string) =>
    apiClient.get(`/admin/astrologers/${astrologerId}`),
  
  approveAstrologer: (astrologerId: string, adminNotes?: string) =>
    apiClient.post(`/admin/astrologers/${astrologerId}/approve`, { adminNotes }),
  
  rejectAstrologer: (astrologerId: string, reason: string) =>
    apiClient.post(`/admin/astrologers/${astrologerId}/reject`, { reason }),
  
  updateAstrologerStatus: (astrologerId: string, status: string) =>
    apiClient.patch(`/admin/astrologers/${astrologerId}/status`, { status }),
  
  updateAstrologerPricing: (astrologerId: string, pricing: any) =>
    apiClient.patch(`/admin/astrologers/${astrologerId}/pricing`, pricing),
  
  // ✅ NEW: Update astrologer bio
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

  // ✅ NEW: Admin Management
  getAllAdmins: (params?: any) =>
    apiClient.get('/admin/admins', { params }),
  
  createAdmin: (data: any) =>
    apiClient.post('/admin/auth/create-admin', data),

  // ✅ NEW: Activity Logs
  getActivityLogs: (params?: any) =>
    apiClient.get('/admin/activity-logs', { params }),
};
