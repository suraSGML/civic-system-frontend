/**
 * Zustand store for authentication state.
 * Persists tokens to localStorage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'citizen' | 'field_worker' | 'authority' | 'super_admin';
  phone?: string;
  avatar?: string;
  city: string;
  region: string;
  is_verified: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setTokens: (access: string, refresh: string) => void;
}

interface RegisterData {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  phone?: string;
  city?: string;
  region?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login/', { email, password });
          const { user, access, refresh } = response.data;
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register/', data);
          const { user, access, refresh } = response.data;
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { refreshToken } = get();
          if (refreshToken) {
            await api.post('/auth/logout/', { refresh: refreshToken });
          }
        } catch (_) {}
        delete api.defaults.headers.common['Authorization'];
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      setTokens: (access, refresh) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        set({ accessToken: access, refreshToken: refresh });
      },
    }),
    {
      name: 'civic-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
