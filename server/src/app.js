'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const env = require('./config/env');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/error.middleware');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const workspaceRoutes = require('./modules/workspaces/workspace.routes');
const projectRoutes = require('./modules/projects/project.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const { taskRouter: commentTaskRouter, commentRouter } = require('./modules/comments/comment.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const uploadRoutes = require('./modules/uploads/upload.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const searchRoutes = require('./modules/search/search.routes');

const app = express();

// Trust Vite dev proxy / reverse proxy so rate limiting uses real client IP
if (env.NODE_ENV !== 'production') {
  app.set('trust proxy', 1);
}

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow static file serving
}));

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────
const isDev = env.NODE_ENV === 'development';
const isTest = env.NODE_ENV === 'test';

// In dev/test mode, bypass all rate limiting
const noLimit = (_req, _res, next) => next();

const globalLimiter = isDev || isTest ? noLimit : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = isDev || isTest ? noLimit : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

const searchLimiter = isDev || isTest ? noLimit : rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many search requests.' },
});

app.use(globalLimiter);

// ── Body parsers + cookies ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Static file serving for uploads ───────────────────────────────────────
const uploadDir = path.resolve(env.UPLOAD_DIR || 'uploads');
app.use('/uploads', express.static(uploadDir));

// ── Swagger docs ───────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: 'Mini SaaS API Docs',
}));

// ── Health check ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Service health check
 *     description: Returns database and Redis connection status. No authentication required.
 *     security: []
 *     responses:
 *       200:
 *         description: Service healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *       503:
 *         description: Service degraded (database disconnected)
 */
app.get('/health', (_req, res) => {
  const mongoose = require('mongoose');
  const { isRedisConnected } = require('./config/redis');

  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatus = dbState[mongoose.connection.readyState] ?? 'unknown';
  const redisStatus = isRedisConnected() ? 'connected' : 'disconnected';
  const healthy = dbStatus === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database: dbStatus,
    redis: redisStatus,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    version: '1.0.0',
  });
});

// ── API routes ─────────────────────────────────────────────────────────────
const API = '/api/v1';

app.get(API, (_req, res) => {
  res.status(200).json({ success: true, message: 'Mini SaaS API v1', version: '1.0.0' });
});

app.use(`${API}/auth`, authLimiter, authRoutes);
app.use(`${API}/users`, userRoutes);
app.use(`${API}/workspaces`, workspaceRoutes);
app.use(`${API}/projects`, projectRoutes);
app.use(`${API}/tasks`, taskRoutes);
app.use(`${API}/tasks/:taskId/comments`, commentTaskRouter);
app.use(`${API}/comments`, commentRouter);
app.use(`${API}/notifications`, notificationRoutes);
app.use(`${API}/upload`, uploadRoutes);
app.use(`${API}/chat`, chatRoutes);
app.use(`${API}/search`, searchLimiter, searchRoutes);

// ── 404 + global error handler ─────────────────────────────────────────────
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
