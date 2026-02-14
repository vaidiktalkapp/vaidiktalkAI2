import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Admin } from '@/types'; // Ensure this path matches your types file

interface AuthState {
  admin: Admin | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: Admin, token: string) => void;
  logout: () => void;
  hydrate: () => void; // ✅ Added missing definition
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isAuthenticated: false,

      setAuth: (admin, token) => {
        // Save token to simple localStorage for easy access by API interceptors
        if (typeof window !== 'undefined') {
          localStorage.setItem('admin_token', token);
        }
        set({ admin, token, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
        }
        set({ admin: null, token: null, isAuthenticated: false });
      },

      // ✅ Implemented manual hydration logic
      hydrate: () => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('admin_token');
        
        if (token) {
          // If a token exists, we assume the user is authenticated.
          // The 'admin' object will be auto-restored by the 'persist' middleware separately.
          set((state) => ({ 
            ...state, 
            token, 
            isAuthenticated: true 
          }));
        } else {
          // If no token, ensure we are logged out
          set({ 
            token: null, 
            isAuthenticated: false, 
            admin: null 
          });
        }
      },
    }),
    {
      name: 'admin-auth-storage', // Unique name for localStorage key
      partialize: (state) => ({ admin: state.admin }), // Only persist the admin object automatically
    }
  )
);
