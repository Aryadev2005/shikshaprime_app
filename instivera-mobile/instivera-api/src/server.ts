import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import config from './config';
import logger from './utils/logger';
import { createApp } from './app';
import { validateEnv } from './utils/validateEnv';
import { closeAllConnections } from './db';
import { verifyTokenFromSocket } from './middleware/auth.middleware';
import { persistAndFormatMessage, MessageService } from './modules/chat/message.service';

validateEnv(['JWT_SECRET', 'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USERNAME', 'DB_PASSWORD']);

const app = createApp();
const httpServer = createServer(app);

// ── Socket.io setup ──────────────────────────────────────────────────────────
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Socket middleware — verify JWT from handshake.auth.token
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return next(new Error('Authentication error: no token'));
  }
  const decoded = verifyTokenFromSocket(token);
  if (!decoded) {
    return next(new Error('Authentication error: invalid token'));
  }
  socket.data.user = decoded;
  socket.data.tenant = (socket.handshake.auth?.tenant as string) || 'default';
  next();
});

/** Extract numeric userId + userType string from socket.data.user */
function resolveSocketUser(socket: Socket): { userId: number; userType: string } | null {
  const user = socket.data.user;
  const userId = Number(user?.id || user?.user_id || user?.sub);
  const userType: string = user?.role || user?.user_type || user?.type || '';
  if (!userId || !userType) return null;
  return { userId, userType };
}

io.on('connection', (socket: Socket) => {
  const tenant: string = socket.data.tenant;
  const resolved = resolveSocketUser(socket);

  if (!resolved) {
    socket.disconnect(true);
    return;
  }

  logger.info({ userId: resolved.userId, userType: resolved.userType, tenant }, 'Socket connected');

  // ── join_conversation ──────────────────────────────────────────────────────
  socket.on('join_conversation', (data: { conversationId: number | string }) => {
    const roomId = `conv:${data.conversationId}`;
    socket.join(roomId);
    socket.emit('joined', { conversationId: data.conversationId, room: roomId });
  });

  // ── send_message ───────────────────────────────────────────────────────────
  socket.on(
    'send_message',
    async (data: {
      conversationId: number;
      content: string;
      fileUrl?: string;
      messageType?: string;
    }) => {
      if (!data.conversationId || (!data.content && !data.fileUrl)) {
        socket.emit('error', { message: 'conversationId and content (or fileUrl) are required' });
        return;
      }
      try {
        const message = await persistAndFormatMessage(
          data.conversationId,
          resolved.userId,
          resolved.userType,
          data.content || '',
          data.messageType || 'text',
          tenant,
        );
        io.to(`conv:${data.conversationId}`).emit('new_message', message);
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to send message' });
      }
    },
  );

  // ── typing ─────────────────────────────────────────────────────────────────
  socket.on('typing', (data: { conversationId: number; isTyping: boolean }) => {
    socket.to(`conv:${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId: resolved.userId,
      userType: resolved.userType,
      isTyping: data.isTyping,
    });
  });

  // ── mark_read ──────────────────────────────────────────────────────────────
  socket.on('mark_read', async (data: { conversationId: number }) => {
    if (!data.conversationId) return;
    try {
      await MessageService.markAsRead(
        data.conversationId,
        resolved.userId,
        resolved.userType,
        tenant,
      );
      socket.emit('read_confirmed', { conversationId: data.conversationId });
    } catch {
      // silently ignore — read-status errors should not crash the connection
    }
  });

  socket.on('disconnect', (reason) => {
    logger.info({ userId: resolved.userId, reason }, 'Socket disconnected');
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
httpServer.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, '✅ Instivera API started');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown() {
  logger.info('Shutting down...');
  io.close();
  await closeAllConnections();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
