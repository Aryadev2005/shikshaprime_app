import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

const BASE =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace(
    '/api/mobile',
    '',
  ) ?? 'http://localhost:4000';

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io(BASE, {
      auth: { token },
      transports: ['websocket'],
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
