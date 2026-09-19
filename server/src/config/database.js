'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./env');

/**
 * MongoDB connection options
 */
const connectionOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connect to MongoDB
 * @returns {Promise<void>}
 */
async function connectDatabase() {
  const uri = env.NODE_ENV === 'test' ? (env.MONGODB_TEST_URI || env.MONGODB_URI) : env.MONGODB_URI;

  try {
    await mongoose.connect(uri, connectionOptions);
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error('MongoDB disconnect error:', error.message);
    throw error;
  }
}

/**
 * Register mongoose connection event handlers
 */
function registerConnectionEvents() {
  mongoose.connection.on('connected', () => {
    logger.info('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('Mongoose connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from MongoDB');
  });
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
  const shutdown = async (signal) => {
    logger.info(`${signal} received. Closing MongoDB connection...`);
    await disconnectDatabase();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = {
  connectDatabase,
  disconnectDatabase,
  registerConnectionEvents,
  setupGracefulShutdown,
};
