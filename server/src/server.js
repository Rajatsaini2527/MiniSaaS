'use strict';

require('dotenv').config();

const http = require('http');
const app = require('./app');
const { connectDatabase, registerConnectionEvents, setupGracefulShutdown } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { initSocketIO } = require('./config/socket');
const { initQueues, closeQueues } = require('./config/queues');
const logger = require('./utils/logger');
const env = require('./config/env');

async function startServer() {
  try {
    registerConnectionEvents();
    await connectDatabase();

    // Redis (optional — gracefully skips if unavailable)
    await connectRedis();

    // Create HTTP server from Express app
    const httpServer = http.createServer(app);

    // Socket.IO
    initSocketIO(httpServer, env.CORS_ORIGIN);

    // BullMQ (requires Redis)
    initQueues();

    // Graceful shutdown
    setupGracefulShutdown();

    const server = httpServer.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Handle process-level errors
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', reason);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      server.close(() => process.exit(1));
    });

    // Extend graceful shutdown to include Redis + BullMQ
    process.once('SIGTERM', async () => {
      logger.info('SIGTERM received — shutting down');
      await closeQueues().catch(() => {});
      await disconnectRedis().catch(() => {});
      server.close(() => process.exit(0));
    });

    process.once('SIGINT', async () => {
      logger.info('SIGINT received — shutting down');
      await closeQueues().catch(() => {});
      await disconnectRedis().catch(() => {});
      server.close(() => process.exit(0));
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
