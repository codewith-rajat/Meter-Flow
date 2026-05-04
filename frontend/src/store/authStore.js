import { create } from 'zustand';
import { authService } from '../services/api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      set({
        token: response.token,
        refreshToken: response.refreshToken,
        user: response.user,
        isLoading: false
      });
      return response;
    } catch (error) {
      set({
        error: error.error || 'Login failed',
        isLoading: false
      });
      throw error;
    }
  },

  signup: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.signup({ email, password, name });
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      set({
        token: response.token,
        refreshToken: response.refreshToken,
        user: response.user,
        isLoading: false
      });
      return response;
    } catch (error) {
      set({
        error: error.error || 'Signup failed',
        isLoading: false
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      token: null,
      refreshToken: null
    });
  },

  refreshAccessToken: async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;

    try {
      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem('token', response.token);
      localStorage.setItem('refreshToken', response.refreshToken);
      set({
        token: response.token,
        refreshToken: response.refreshToken
      });
    } catch (error) {
      set({ token: null, refreshToken: null, user: null });
    }
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const user = await authService.getProfile();
      set({ user, isLoading: false });
      return user;
    } catch (error) {
      set({ isLoading: false, error: error.error });
      throw error;
    }
  },

  isAuthenticated: () => !!localStorage.getItem('token')
}));
