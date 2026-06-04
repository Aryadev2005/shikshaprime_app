import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/modules/auth.api';
import { MobileUser } from '../types/api';

export interface AuthState {
  user: MobileUser | null;
  token: string | null;
  tenant: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (username: string, password: string, tenant: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: MobileUser | null) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  tenant: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string, tenant: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ username, password });

      await SecureStore.setItemAsync('accessToken', response.token);
      await SecureStore.setItemAsync('tenant', tenant);

      set({
        user: response.user,
        token: response.token,
        tenant,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('tenant');
    set({ user: null, token: null, tenant: null, error: null });
  },

  setUser: (user: MobileUser | null) => {
    set({ user });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const tenant = await SecureStore.getItemAsync('tenant');

      if (token && tenant) {
        set({ token, tenant });
      }
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
    }
  },
}));
