import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

/**
 * FASE 1.1: Store de autenticación básico con Zustand
 */
interface AuthState {
  token: string | null;
  role: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Configure axios interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage');
  if (token) {
    try {
      const parsed = JSON.parse(token);
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  return config;
});

export const useAuthStore = create<AuthState>()(

  persist(
    (set) => ({
      token: null,
      role: null,
      
      login: async (password: string) => {
        try {
          const response = await axios.post(`${API_BASE}/auth/login`, {
            password
          });
          
          const { token, role } = response.data;
          
          // Set axios default header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ token, role });
          return true;
        } catch (error) {
          console.error('Login failed:', error);
          return false;
        }
      },
      
      logout: () => {
        delete axios.defaults.headers.common['Authorization'];
        set({ token: null, role: null });
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Restore axios header on page reload
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
        }
      },
      partialize: (state) => ({ token: state.token, role: state.role })
    }
  )
);