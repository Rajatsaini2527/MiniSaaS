'use strict';

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { getRedisClient, isRedisConnected } = require('./redis');
const { verifyAccessToken } = require('../utils/jwt');
const { User, WorkspaceMember } = require('../models');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO server on an HTTP server instance.
 * @param {import('http').Server} httpServer
 * @param {string} corsOrigin
 */
function initSocketIO(httpServer, corsOrigin) {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Use Redis adapter when available for multi-process support
  if (isRedisConnected()) {
    try {
      const pubClient = getRedisClient().duplicate();
      const subClient = getRedisClient().duplicate();
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO using Redis adapter');
    } catch (err) {
      logger.warn('Socket.IO Redis adapter failed, using in-memory:', err.message);
    }
  }

  // ── Authentication middleware ──────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch {
        return next(new Error('Invalid or expired token'));
      }

      const user = await User.findById(decoded.userId).select('-password');
      if (!user || user.deletedAt || user.status !== 'active') {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      return next();
    } catch {
      return next(new Error('Authentication error'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    logger.info(`Socket connected: user=${userId} socket=${socket.id}`);

    // Auto-join user's personal room
    socket.join(`user:${userId}`);

    // ── Join workspace room ────────────────────────────────────────────────
    socket.on('workspace:join', async ({ workspaceId }) => {
      try {
        const member = await WorkspaceMember.findOne({ workspaceId, userId: socket.user._id });
        if (!member) {
          socket.emit('error', { message: 'Not a workspace member' });
          return;
        }
        socket.join(`workspace:${workspaceId}`);
        socket.emit('workspace:joined', { workspaceId });

        // Broadcast presence
        socket.to(`workspace:${workspaceId}`).emit('user.online', {
          userId,
          name: socket.user.name,
          avatar: socket.user.avatar,
        });
      } catch {
        socket.emit('error', { message: 'Failed to join workspace' });
      }
    });

    // ── Leave workspace room ───────────────────────────────────────────────
    socket.on('workspace:leave', ({ workspaceId }) => {
      socket.leave(`workspace:${workspaceId}`);
      socket.to(`workspace:${workspaceId}`).emit('user.offline', { userId });
    });

    // ── Join project room ──────────────────────────────────────────────────
    socket.on('project:join', async ({ projectId, workspaceId }) => {
      try {
        const member = await WorkspaceMember.findOne({ workspaceId, userId: socket.user._id });
        if (!member) {
          socket.emit('error', { message: 'Not a workspace member' });
          return;
        }
        socket.join(`project:${projectId}`);
        socket.emit('project:joined', { projectId });
      } catch {
        socket.emit('error', { message: 'Failed to join project' });
      }
    });

    // ── Leave project room ─────────────────────────────────────────────────
    socket.on('project:leave', ({ projectId }) => {
      socket.leave(`project:${projectId}`);
    });

    // ── Chat: send message ─────────────────────────────────────────────────
    socket.on('chat.message', async ({ workspaceId, projectId, content }) => {
      try {
        if (!content || typeof content !== 'string' || !content.trim()) { return; }
        const member = await WorkspaceMember.findOne({
          workspaceId,
          userId: socket.user._id,
        });
        if (!member) { return; }

        const Message = require('../models/Message.model');
        const msg = await Message.create({
          workspaceId,
          projectId: projectId || null,
          userId: socket.user._id,
          content: content.trim().slice(0, 2000),
        });

        const payload = {
          _id: msg._id,
          workspaceId,
          projectId: projectId || null,
          content: msg.content,
          user: { _id: socket.user._id, name: socket.user.name, avatar: socket.user.avatar },
          createdAt: msg.createdAt,
        };

        const room = projectId ? `project:${projectId}` : `workspace:${workspaceId}`;
        io.to(room).emit('chat.message', payload);
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── Chat: typing indicator ─────────────────────────────────────────────
    socket.on('chat.typing', ({ workspaceId, projectId, isTyping }) => {
      const room = projectId ? `project:${projectId}` : `workspace:${workspaceId}`;
      socket.to(room).emit('chat.typing', {
        userId,
        name: socket.user.name,
        isTyping: Boolean(isTyping),
      });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user=${userId} socket=${socket.id}`);
      // Notify all rooms the user was in
      socket.rooms.forEach((room) => {
        if (room.startsWith('workspace:')) {
          socket.to(room).emit('user.offline', { userId });
        }
      });
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

/**
 * Get the initialized io instance (for emitting from services/controllers).
 */
function getIO() {
  return io;
}

/**
 * Emit a task event to the relevant workspace and project rooms.
 */
function emitTaskEvent(event, task) {
  if (!io) { return; }
  if (task.workspaceId) {
    io.to(`workspace:${task.workspaceId}`).emit(event, task);
  }
  if (task.projectId) {
    io.to(`project:${task.projectId}`).emit(event, task);
  }
}

/**
 * Emit a notification to a specific user room.
 */
function emitNotification(userId, notification) {
  if (!io) { return; }
  io.to(`user:${userId}`).emit('notification.created', notification);
}

module.exports = { initSocketIO, getIO, emitTaskEvent, emitNotification };
