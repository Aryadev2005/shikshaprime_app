import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import config from './config';
import chatRoutes from './routes/chat.routes';
import { errorMiddleware } from './middleware/error-middleware';
import { tenantMiddleware } from './middleware/tenant-middleware';
import { verifyToken } from './middleware/auth-middleware';
import { getTenantSequelize } from './db';
import { persistAndFormatMessage } from './services/message.service';
import { MessageService } from './services/message.service';

// ── Express ──────────────────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

export { getTenantSequelize };

app.use(json());
app.use(tenantMiddleware);

app.use('/chat', chatRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 1,
    data: { service: 'chat-service', version: '1.0.0' },
    message: 'OK',
  });
});

app.use(errorMiddleware);

// ── Socket.io ────────────────────────────────────────────────────────────────

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
});

const messageService = new MessageService();

/**
 * Socket middleware — verify JWT from handshake.auth.token.
 * The decoded payload is stored on socket.data.user.
 * The tenant from handshake.auth.tenant (or 'default') is stored on socket.data.tenant.
 */
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return next(new Error('Authentication error: no token'));
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Authentication error: invalid token'));
  }
  socket.data.user = decoded;
  socket.data.tenant = (socket.handshake.auth?.tenant as string) || 'default';
  next();
});

/** Helper: extract numeric userId + userType string from socket.data.user */
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

  console.log(`[socket] connected uid=${resolved.userId} type=${resolved.userType} tenant=${tenant}`);

  // ── join_conversation ────────────────────────────────────────────────────
  socket.on('join_conversation', (data: { conversationId: number | string }) => {
    const roomId = `conv:${data.conversationId}`;
    socket.join(roomId);
    socket.emit('joined', { conversationId: data.conversationId, room: roomId });
  });

  // ── send_message ─────────────────────────────────────────────────────────
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
        const message = await persistAndFormatMessage({
          conversationId: data.conversationId,
          senderId: resolved.userId,
          senderType: resolved.userType,
          content: data.content || '',
          fileUrl: data.fileUrl,
          messageType: data.messageType,
          tenant,
        });

        // Broadcast to everyone in the conversation room (including sender)
        io.to(`conv:${data.conversationId}`).emit('new_message', message);
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Failed to send message' });
      }
    }
  );

  // ── typing ───────────────────────────────────────────────────────────────
  socket.on('typing', (data: { conversationId: number; isTyping: boolean }) => {
    socket.to(`conv:${data.conversationId}`).emit('typing', {
      conversationId: data.conversationId,
      userId: resolved.userId,
      userType: resolved.userType,
      isTyping: data.isTyping,
    });
  });

  // ── mark_read ────────────────────────────────────────────────────────────
  socket.on('mark_read', async (data: { conversationId: number }) => {
    if (!data.conversationId) return;
    try {
      await messageService.markAsRead(
        data.conversationId,
        resolved.userId,
        resolved.userType,
        tenant
      );
      socket.emit('read_confirmed', { conversationId: data.conversationId });
    } catch {
      // silently ignore — read-status errors should not crash the connection
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected uid=${resolved.userId} reason=${reason}`);
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = config.port || 9058;
httpServer.listen(PORT, () => {
  console.log(`Chat service (REST + Socket.io) is running on http://localhost:${PORT}`);
});
