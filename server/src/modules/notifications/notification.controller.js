'use strict';

const notificationService = require('../../services/notification.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * GET /api/v1/notifications
 */
async function getNotifications(req, res, next) {
  try {
    const { notifications, pagination, unreadCount } = await notificationService.getNotifications(
      req.user._id,
      {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        isRead: req.query.isRead,
      }
    );
    return res
      .status(200)
      .json(ApiResponse.paginated(notifications, pagination, 'Notifications retrieved', { unreadCount }));
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 */
async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user._id);
    return res.status(200).json(ApiResponse.success(notification, 'Notification marked as read'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/notifications/read-all
 */
async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user._id);
    return res.status(200).json(ApiResponse.success(null, 'All notifications marked as read'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
