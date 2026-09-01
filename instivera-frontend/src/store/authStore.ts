import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../api/modules/auth.api';
import { MobileUser } from '../types/api';
import { decodeJwtRole } from '../lib/jwt';
import { disconnectSocket } from '../lib/socket';

const USER_KEY = 'authUser';

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
  /**
   * Single source of truth for the caller's role.
   * Taken from the login payload, falling back to the JWT's `role` claim so it
   * survives a restart even if the user object is unavailable.
   */
  role: string | null;

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
  role: null,

  login: async (username: string, password: string, tenant: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ username, password });

      await SecureStore.setItemAsync('accessToken', response.token);
      await SecureStore.setItemAsync('tenant', tenant);
      // Persist the user: `role` gates which API endpoints the app calls, and
      // without this it was null after every restart.
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

      set({
        user: response.user,
        token: response.token,
        tenant,
        role: response.user?.role ?? decodeJwtRole(response.token),
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  logout: async () => {
    // The chat socket is an app-wide singleton authenticated with this token —
    // drop it here so the next user doesn't inherit the previous handshake.
    disconnectSocket();
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('tenant');
    await SecureStore.deleteItemAsync('selectedInstitution');
    await SecureStore.deleteItemAsync(USER_KEY);
    set({
      user: null,
      token: null,
      tenant: null,
      error: null,
      selectedInstitution: null,
      role: null,
    });
  },

  setUser: (user: MobileUser | null) => {
    set({ user, role: user?.role ?? null });
    if (user) {
      void SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    } else {
      void SecureStore.deleteItemAsync(USER_KEY);
    }
  },

  setSelectedInstitution: async (institution: SelectedInstitution) => {
    set({ selectedInstitution: institution });
    await SecureStore.setItemAsync('selectedInstitution', JSON.stringify(institution));
    // Also keep tenant key in sync so publicAxios interceptor can read it
    await SecureStore.setItemAsync('selectedInstitutionTenant', institution.tenant);
  },

  hydrate: async () => {
    try {
      const [token, tenant, institutionRaw, userRaw] = await Promise.all([
        SecureStore.getItemAsync('accessToken'),
        SecureStore.getItemAsync('tenant'),
        SecureStore.getItemAsync('selectedInstitution'),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      const parse = <T,>(raw: string | null): T | null => {
        if (!raw) return null;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      };

      const selectedInstitution = parse<SelectedInstitution>(institutionRaw);
      const user = parse<MobileUser>(userRaw);

      if (token && tenant) {
        set({
          token,
          tenant,
          user,
          role: user?.role ?? decodeJwtRole(token),
          selectedInstitution,
        });
      } else {
        set({ selectedInstitution });
      }
    } catch (error) {
      console.error('Failed to hydrate auth state:', error);
    }
  },
}));
