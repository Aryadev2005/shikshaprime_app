import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

const BASE =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(
    '/api/mobile',
    '',
  ) ?? 'http://127.0.0.1:4000';

let socket: Socket | null = null;

/**
 * Get or create the Socket.io connection.
 * Must be called after login (token and tenant must be in authStore).
 * Reads tenant synchronously from Zustand store — no async needed.
 */
export const getSocket = (token: string): Socket => {
  if (!socket) {
    // useAuthStore.getState() is Zustand's imperative getter — works outside React components
    const tenant = useAuthStore.getState().tenant ?? '';
    if (!tenant) {
      console.warn('[socket] No tenant in store at connection time — chat messages may be misrouted');
    }

    socket = io(BASE, {
      auth: { token, tenant },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
