'use strict';

const notificationRepo = require('../repositories/notification.repository');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');
const { invalidateNotifications } = require('./cache.service');
const { emitNotification } = require('../config/socket');

async function getNotifications(userId, { page, limit, isRead }) {
  const filter = {};
  if (typeof isRead === 'string') { filter.isRead = isRead === 'true'; }
  const { notifications, total } = await notificationRepo.findByUserId(userId, { page, limit, isRead: filter.isRead });
  const unreadCount = await notificationRepo.countUnread(userId);
  return { notifications, pagination: buildPaginationMeta(total, page, limit), unreadCount };
}

async function markAsRead(notificationId, userId) {
  const notification = await notificationRepo.markAsRead(notificationId, userId);
  if (!notification) { throw ApiError.notFound('Notification not found'); }
  invalidateNotifications(userId).catch(() => {});
  return notification;
}

async function markAllAsRead(userId) {
  await notificationRepo.markAllAsRead(userId);
  invalidateNotifications(userId).catch(() => {});
}

/**
 * Create a notification and emit it via Socket.IO
 */
async function createAndEmit(data) {
  try {
    const notif = await notificationRepo.create(data);
    emitNotification(data.userId.toString(), notif);
    invalidateNotifications(data.userId.toString()).catch(() => {});
    return notif;
  } catch {
    return null;
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, createAndEmit };
