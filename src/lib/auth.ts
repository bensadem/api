import { create } from 'zustand';
import Cookies from 'js-cookie';
import { authApi } from './api';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, securityCode?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string, securityCode?: string) => {
    try {
      const response = await authApi.login(email, password, securityCode);
      const { token, user } = response.data.data;

      if (user.role !== 'admin' && user.role !== 'superadmin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      Cookies.set('admin_token', token, { expires: 7 });
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error: any) {
      throw error.response?.data?.message || error.message || 'Login failed';
    }
  },

  logout: () => {
    Cookies.remove('admin_token');
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = Cookies.get('admin_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await authApi.getProfile();
      const user = response.data.data.user;

      if (user.role !== 'admin' && user.role !== 'superadmin') {
        Cookies.remove('admin_token');
        set({ isLoading: false, isAuthenticated: false, user: null });
        return;
      }

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      Cookies.remove('admin_token');
      set({ isLoading: false, isAuthenticated: false, user: null });
    }
  },
}));
