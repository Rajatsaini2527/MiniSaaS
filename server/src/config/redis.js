'use strict';

const Redis = require('ioredis');
const logger = require('../utils/logger');
const env = require('./env');

let redisClient = null;
let isConnected = false;

/**
 * Get or create the Redis client (singleton).
 * Returns null when Redis is disabled via REDIS_ENABLED=false.
 */
function getRedisClient() {
  if (!env.REDIS_ENABLED) {
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 5) {
        logger.warn('Redis: max reconnection attempts reached, disabling cache');
        return null; // stop retrying
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => {
    isConnected = true;
    logger.info('Redis connected');
  });

  redisClient.on('error', (err) => {
    isConnected = false;
    logger.warn('Redis error:', err.message);
  });

  redisClient.on('close', () => {
    isConnected = false;
  });

  return redisClient;
}

/**
 * Connect to Redis (call from server startup)
 */
async function connectRedis() {
  if (!env.REDIS_ENABLED) {
    logger.info('Redis disabled (REDIS_ENABLED=false) — cache will be skipped');
    return;
  }
  try {
    const client = getRedisClient();
    await client.connect();
  } catch (err) {
    logger.warn('Redis connection failed — continuing without cache:', err.message);
  }
}

/**
 * Disconnect Redis gracefully
 */
async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isConnected = false;
    logger.info('Redis disconnected');
  }
}

function isRedisConnected() {
  return isConnected;
}

module.exports = { getRedisClient, connectRedis, disconnectRedis, isRedisConnected };
