'use strict';

const { getRedisClient, isRedisConnected } = require('../config/redis');
const logger = require('../utils/logger');

// Default TTLs (seconds)
const TTL = {
  DASHBOARD: 60,        // 1 minute
  PROJECT_LIST: 120,    // 2 minutes
  TASK_LIST: 60,        // 1 minute
  NOTIFICATIONS: 30,    // 30 seconds
  DEFAULT: 60,
};

// Structured cache key builders
const CacheKeys = {
  dashboard: (workspaceId) => `workspace:${workspaceId}:dashboard`,
  projectList: (workspaceId) => `workspace:${workspaceId}:projects`,
  taskList: (projectId) => `project:${projectId}:tasks`,
  taskListWs: (workspaceId) => `workspace:${workspaceId}:tasks`,
  notifications: (userId) => `user:${userId}:notifications`,
  presence: (workspaceId) => `workspace:${workspaceId}:presence`,
};

/**
 * Get a cached value. Returns null on cache miss or Redis unavailable.
 * @param {string} key
 * @returns {Promise<*|null>}
 */
async function get(key) {
  if (!isRedisConnected()) { return null; }
  try {
    const raw = await getRedisClient().get(key);
    if (!raw) { return null; }
    return JSON.parse(raw);
  } catch (err) {
    logger.warn('Cache get error:', err.message);
    return null;
  }
}

/**
 * Set a cached value with TTL.
 * @param {string} key
 * @param {*} value
 * @param {number} [ttl] seconds
 */
async function set(key, value, ttl = TTL.DEFAULT) {
  if (!isRedisConnected()) { return; }
  try {
    await getRedisClient().setex(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.warn('Cache set error:', err.message);
  }
}

/**
 * Delete one or more cache keys (supports glob patterns via SCAN+DEL).
 * @param {...string} keys
 */
async function del(...keys) {
  if (!isRedisConnected()) { return; }
  try {
    const client = getRedisClient();
    for (const key of keys) {
      if (key.includes('*')) {
        // Pattern delete via SCAN
        let cursor = '0';
        do {
          const [nextCursor, found] = await client.scan(cursor, 'MATCH', key, 'COUNT', 100);
          cursor = nextCursor;
          if (found.length > 0) {
            await client.del(...found);
          }
        } while (cursor !== '0');
      } else {
        await client.del(key);
      }
    }
  } catch (err) {
    logger.warn('Cache del error:', err.message);
  }
}

/**
 * Invalidate all caches related to a workspace's tasks/projects/dashboard.
 * Call this after any write to tasks or projects.
 * @param {string} workspaceId
 * @param {string} [projectId]
 */
async function invalidateWorkspace(workspaceId, projectId = null) {
  const keys = [
    CacheKeys.dashboard(workspaceId),
    CacheKeys.projectList(workspaceId),
    CacheKeys.taskListWs(workspaceId),
  ];
  if (projectId) {
    keys.push(CacheKeys.taskList(projectId));
  }
  await del(...keys);
}

/**
 * Invalidate a user's notification cache.
 * @param {string} userId
 */
async function invalidateNotifications(userId) {
  await del(CacheKeys.notifications(userId));
}

/**
 * Wrap an async function with cache-aside pattern.
 * If cached: return cached value.
 * If not: call fn(), cache result, return it.
 */
async function cacheAside(key, fn, ttl = TTL.DEFAULT) {
  const cached = await get(key);
  if (cached !== null) { return cached; }
  const result = await fn();
  await set(key, result, ttl);
  return result;
}

module.exports = {
  get,
  set,
  del,
  invalidateWorkspace,
  invalidateNotifications,
  cacheAside,
  CacheKeys,
  TTL,
};
