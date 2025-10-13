// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Admin } from '@/types';

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: Admin, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (admin, token) => {
        localStorage.setItem('admin_token', token);
        set({ admin, token, isAuthenticated: true });
      },
      
      logout: () => {
        localStorage.removeItem('admin_token');
        set({ admin: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'admin-auth-storage',
    }
  )
);
