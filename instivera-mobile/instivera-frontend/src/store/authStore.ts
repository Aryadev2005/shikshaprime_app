import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/modules/auth.api';
import { MobileUser } from '../types/api';

export interface SelectedInstitution {
  tenant: string;
  name: string;
  type: 'school' | 'college';
}

export interface AuthState {
  user: MobileUser | null;
  token: string | null;
  tenant: string | null;
  isLoading: boolean;
  error: string | null;
  selectedInstitution: SelectedInstitution | null;

  // Actions
  login: (username: string, password: string, tenant: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: MobileUser | null) => void;
  hydrate: () => Promise<void>;
  setSelectedInstitution: (institution: SelectedInstitution) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  tenant: null,
  isLoading: false,
  error: null,
  selectedInstitution: null,

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
    await SecureStore.deleteItemAsync('selectedInstitution');
    set({ user: null, token: null, tenant: null, error: null, selectedInstitution: null });
  },

  setUser: (user: MobileUser | null) => {
    set({ user });
  },

  setSelectedInstitution: async (institution: SelectedInstitution) => {
    set({ selectedInstitution: institution });
    await SecureStore.setItemAsync('selectedInstitution', JSON.stringify(institution));
    // Also keep tenant key in sync so publicAxios interceptor can read it
    await SecureStore.setItemAsync('selectedInstitutionTenant', institution.tenant);
  },

  hydrate: async () => {
    try {
      const [token, tenant, institutionRaw] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('tenant'),
        SecureStore.getItemAsync('selectedInstitution'),
      ]);

      const selectedInstitution: SelectedInstitution | null = institutionRaw
        ? (JSON.parse(institutionRaw) as SelectedInstitution)
        : null;

      if (token && tenant) {
        set({ token, tenant, selectedInstitution });
      } else {
        set({ selectedInstitution });
      }
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
    }
  },
}));
