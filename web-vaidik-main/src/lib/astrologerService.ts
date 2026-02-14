// lib/astrologerService.ts
import apiClient from './api';
import { getWebDeviceInfo } from './deviceInfo';

export interface SearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  skills?: string[];
  languages?: string[];
  genders?: string[];
  countries?: string[];
  topAstrologers?: string[];
  search?: string;
  isOnline?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export const astrologerService = {
  searchAstrologers: async (params: SearchParams = {}) => {
    try {
      const query = new URLSearchParams();

      query.append('page', String(params.page || 1));
      query.append('limit', String(params.limit || 20));
      query.append('sortBy', params.sortBy || 'popularity');

      if (params.skills?.length) params.skills.forEach(s => query.append('skills', s));
      if (params.languages?.length) params.languages.forEach(l => query.append('languages', l));
      if (params.genders?.length) params.genders.forEach(g => query.append('genders', g));
      if (params.countries?.length) params.countries.forEach(c => query.append('countries', c));
      if (params.topAstrologers?.length) params.topAstrologers.forEach(t => query.append('topAstrologers', t));

      if (params.search) query.append('search', params.search);
      if (params.isOnline) query.append('isOnline', 'true');
      if (params.minPrice) query.append('minPrice', String(params.minPrice));
      if (params.maxPrice) query.append('maxPrice', String(params.maxPrice));

      const queryString = query.toString();
      console.log('📡 Full API URL:', `/astrologers/search?${queryString}`);

      const response = await apiClient.get(`/astrologers/search?${queryString}`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data.astrologers,
          pagination: response.data.data.pagination,
        };
      }
      throw new Error(response.data.message || 'Failed to fetch astrologers');
    } catch (error) {
      console.error('❌ Search astrologers error:', error);
      throw error;
    }
  },
  getFavorites: async () => {
    try {
      console.log('📡 Fetching favorite astrologers...');
      const response = await apiClient.get('/users/favorites');

      if (response.data.success) {
        console.log('✅ Favorites fetched:', response.data.data.length, 'items');
        return {
          success: true,
          data: response.data.data,
        };
      }

      throw new Error(response.data.message || 'Failed to fetch favorites');
    } catch (error) {
      console.error('❌ Get favorites error:', error);
      throw error;
    }
  },

  addFavorite: async (astrologerId: any) => {
    try {
      console.log('📡 Adding to favorites:', astrologerId);
      const response = await apiClient.post(`/users/favorites/${astrologerId}`);

      if (response.data.success) {
        console.log('✅ Added to favorites');
        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || 'Failed to add favorite');
    } catch (error) {
      console.error('❌ Add favorite error:', error);
      throw error;
    }
  },

  removeFavorite: async (astrologerId: any) => {
    try {
      console.log('📡 Removing from favorites:', astrologerId);
      const response = await apiClient.delete(`/users/favorites/${astrologerId}`);

      if (response.data.success) {
        console.log('✅ Removed from favorites');
        return {
          success: true,
          message: response.data.message,
        };
      }

      throw new Error(response.data.message || 'Failed to remove favorite');
    } catch (error) {
      console.error('❌ Remove favorite error:', error);
      throw error;
    }
  },
  
  getAstrologerDetails: async (astrologerId: string) => {
    try {
      console.log('📡 Fetching astrologer details:', astrologerId);
      const response = await apiClient.get(`/astrologers/${astrologerId}`);

      if (response.data.success) {
        console.log('✅ Astrologer details fetched:', response.data.data.astrologer);
        return {
          success: true,
          data: response.data.data.astrologer,
        };
      }

      throw new Error(response.data.message || 'Failed to fetch astrologer details');
    } catch (error) {
      console.error('❌ Get astrologer details error:', error);
      throw error;
    }
  },
 // ✅ NEW: Check if phone exists (Prevents "no response" issue)
  checkPhone: async (phoneNumber: string, countryCode: string) => {
    try {
      // Calls the backend check-phone endpoint
      return await apiClient.post('/auth/astrologer/check-phone', { phoneNumber, countryCode });
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // ✅ NEW: Send OTP
  sendLoginOtp: async (phoneNumber: string, countryCode: string) => {
    try {
      return await apiClient.post('/auth/astrologer/send-otp', { phoneNumber, countryCode });
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // ✅ NEW: Verify OTP
verifyLoginOtp: async (phoneNumber: string, countryCode: string, otp: string) => {
    try {
      // Generate device info on the client side
      const deviceInfo = getWebDeviceInfo();
      
      return await apiClient.post('/auth/astrologer/verify-otp', { 
        phoneNumber, 
        countryCode, 
        otp,
        // Spread device info fields (deviceId, deviceType, deviceName)
        ...deviceInfo,
        // Provide a default for fcmToken if strictly required as string, or rely on backend IsOptional
        fcmToken: 'web-no-token' 
      });
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },

  // ✅ NEW: Delete Account (Requires Auth Token)
  deleteAccount: async (reason?: string) => {
    try {
      return await apiClient.delete('/astrologer/account', { data: { reason } });
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};

export default astrologerService;
