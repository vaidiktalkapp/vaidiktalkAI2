// src/lib/AuthService.ts
import { apiClient } from './api';
import { getWebDeviceInfo } from './deviceInfo';
import { getFCMToken } from './firebase';
import { User } from './types';

export class AuthService {
  static async sendOtp(phoneNumber: string, countryCode: string) {
    console.log('📡 Sending OTP...', phoneNumber, 'country code', countryCode);
    const response = await apiClient.post('/auth/send-otp', {
      phoneNumber,
      countryCode,
    });
    return response.data;
  }

  static async verifyOtp(phoneNumber: string, countryCode: string, otp: string) {
    console.log('📡 Verifying OTP...', phoneNumber, countryCode, otp);
    const deviceInfo = getWebDeviceInfo();
    const fcmToken = await getFCMToken();
    console.log('📱 Device info:', deviceInfo);
    console.log('🔔 FCM Token:', fcmToken);
    
    const response = await apiClient.post('/auth/verify-otp', {
      phoneNumber,
      countryCode,
      otp,
      fcmToken: fcmToken || undefined,
      deviceId: deviceInfo.deviceId,
      deviceType: deviceInfo.deviceType,
      deviceName: deviceInfo.deviceName,
    });

    console.log('✅ OTP Verification Response:', response.data);
    
    if (response.data.success) {
      const { tokens } = response.data.data;
      const { accessToken, refreshToken } = tokens || {};
      
      console.log('🔑 Access Token received:', accessToken ? 'Yes' : 'No');
      console.log('🔑 Refresh Token received:', refreshToken ? 'Yes' : 'No');

      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        console.log('✅ Access token stored in localStorage');
      }

      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
        console.log('✅ Refresh token stored in localStorage');
      }

      // 🆕 FETCH FULL USER PROFILE after storing tokens
      try {
        const profileResponse = await apiClient.get('/users/profile');
        if (profileResponse.data.success && profileResponse.data.data) {
          const fullUser = profileResponse.data.data;
          
          // 🆕 Ensure both _id and id exist
          if (fullUser._id && !fullUser.id) {
            fullUser.id = fullUser._id;
          } else if (fullUser.id && !fullUser._id) {
            fullUser._id = fullUser.id;
          }
          
          localStorage.setItem('userData', JSON.stringify(fullUser));
          console.log('✅ Full user profile stored:', fullUser.name, 'ID:', fullUser._id);
          
          // Return with full user data
          return {
            ...response.data,
            data: {
              ...response.data.data,
              user: fullUser,
            },
          };
        }
      } catch (profileError) {
        console.error('⚠️ Failed to fetch profile, using token user data:', profileError);
      }
    }

    return response.data;
  }

  static async verifyTruecaller(truecallerData: any) {
    const response = await apiClient.post('/auth/truecaller', truecallerData);
    
    if (response.data.success) {
      const { accessToken, refreshToken } = response.data.data;
      
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // 🆕 FETCH FULL USER PROFILE
      try {
        const profileResponse = await apiClient.get('/users/profile');
        if (profileResponse.data.success && profileResponse.data.data) {
          const fullUser = profileResponse.data.data;
          
          if (fullUser._id && !fullUser.id) {
            fullUser.id = fullUser._id;
          } else if (fullUser.id && !fullUser._id) {
            fullUser._id = fullUser.id;
          }
          
          localStorage.setItem('userData', JSON.stringify(fullUser));
          console.log('✅ Full user profile stored');
          
          return {
            ...response.data,
            data: {
              ...response.data.data,
              user: fullUser,
            },
          };
        }
      } catch (profileError) {
        console.error('⚠️ Failed to fetch profile:', profileError);
      }
    }
    
    return response.data;
  }

  static async logout() {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userData');
      console.log('✅ Logged out - tokens cleared');
    }
  }

  static async checkAuthStatus() {
    try {
      if (typeof window === 'undefined') {
        console.log('⚠️ Not in browser environment');
        return { isAuthenticated: false, user: null };
      }

      const token = localStorage.getItem('accessToken');
      const userData = localStorage.getItem('userData');
      
      console.log('🔍 [AuthService] Checking auth status...');
      console.log('🔑 [AuthService] Token found:', token ? 'Yes' : 'No');
      console.log('👤 [AuthService] User data found:', userData ? 'Yes' : 'No');
      
      if (!token || !userData) {
        console.log('⚠️ [AuthService] Missing token or user data');
        return { isAuthenticated: false, user: null };
      }

      try {
        const user = JSON.parse(userData);
        
        // 🆕 Ensure both _id and id exist
        if (user._id && !user.id) {
          user.id = user._id;
        } else if (user.id && !user._id) {
          user._id = user.id;
        }
        
        console.log('✅ [AuthService] Auth valid from localStorage - User:', user.name, 'ID:', user._id);
        return { isAuthenticated: true, user };
      } catch (parseError) {
        console.error('❌ [AuthService] Failed to parse user data:', parseError);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
        return { isAuthenticated: false, user: null };
      }
    } catch (error: any) {
      console.error('❌ [AuthService] Auth check failed:', error);
      return { isAuthenticated: false, user: null };
    }
  }

  static async storeUser(user: any) {
    // 🆕 Ensure both _id and id exist
    if (user._id && !user.id) {
      user.id = user._id;
    } else if (user.id && !user._id) {
      user._id = user.id;
    }
    
    localStorage.setItem('userData', JSON.stringify(user));
    console.log('✅ User data stored');
  }

  static async refreshUserProfile() {
    try {
      const response = await apiClient.get('/users/profile');
      if (response.data.success && response.data.data) {
        const user = response.data.data;
        
        if (user._id && !user.id) {
          user.id = user._id;
        } else if (user.id && !user._id) {
          user._id = user.id;
        }
        
        await this.storeUser(user);
        return user;
      }
      return null;
    } catch (error) {
      console.error('❌ Failed to refresh user profile:', error);
      return null;
    }
  }

  // 👇 FIXED: Changed from .put to .patch
  static async updateProfile(data: Partial<User>) {
    try {
      const response = await apiClient.patch('/users/profile', data);
      
      if (response.data.success) {
        // Update local storage with new data
        await this.refreshUserProfile(); 
      }
      return response.data;
    } catch (error: any) {
        console.error('Update profile error', error);
        throw error.response?.data || error;
    }
  }

  static async deleteAccount(reason?: string) {
    try {
      console.log('⚠️ [AuthService] Requesting account deletion...');
      const response = await apiClient.delete('/users/account', {
        data: { reason } // Axios sends body in 'data' for DELETE requests
      });
      
      if (response.data.success) {
        // Clear local session immediately upon success
        await this.logout();
        return response.data;
      }
      throw new Error(response.data.message);
    } catch (error: any) {
      console.error('❌ Delete account error:', error);
      throw error.response?.data || error;
    }
  }
}