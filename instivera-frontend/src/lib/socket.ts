import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';

/**
 * App-wide Socket.io connection.
 *
 * Deliberately takes `token`/`tenant` as arguments rather than reaching into
 * the auth store: it keeps this module free of a `socket -> authStore` import
 * cycle (the store now tears the socket down on logout) and makes the tenant
 * a hard requirement at the call site instead of a runtime warning.
 */

let socket: Socket | null = null;
let socketKey: string | null = null;

/** Get or create the shared connection, reconnecting if the identity changed. */
export const getSocket = (token: string, tenant: string): Socket => {
  const key = `${tenant}:${token}`;

  // A different user/tenant must not reuse the previous socket's auth handshake.
  if (socket && socketKey !== key) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token, tenant },
      transports: ['websocket', 'polling'],
    });
    socketKey = key;
  }

  return socket;
};

/** Tear down the shared connection. Call on logout, not on screen unmount. */
export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
  socketKey = null;
};
