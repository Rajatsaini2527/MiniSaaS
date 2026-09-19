'use strict';

const { Notification } = require('../models');
const { buildSkipLimit } = require('../utils/pagination');

/**
 * Create a notification
 */
async function create(data) {
  return Notification.create(data);
}

/**
 * Create multiple notifications
 */
async function createMany(items) {
  return Notification.insertMany(items);
}

/**
 * Find notification by ID
 */
async function findById(id) {
  return Notification.findById(id);
}

/**
 * List notifications for a user with pagination
 */
async function findByUserId(userId, { page = 1, limit = 20, isRead } = {}) {
  const { skip } = buildSkipLimit(page, limit);
  const filter = { userId };
  if (typeof isRead === 'boolean') {
    filter.isRead = isRead;
  }
  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);
  return { notifications, total };
}

/**
 * Mark a single notification as read
 */
async function markAsRead(id, userId) {
  return Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
}

/**
 * Mark all notifications for a user as read
 */
async function markAllAsRead(userId) {
  return Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
}

/**
 * Count unread notifications for a user
 */
async function countUnread(userId) {
  return Notification.countDocuments({ userId, isRead: false });
}

module.exports = {
  create,
  createMany,
  findById,
  findByUserId,
  markAsRead,
  markAllAsRead,
  countUnread,
};
