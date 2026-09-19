'use strict';

const { Router } = require('express');
const controller = require('./notification.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const { validate } = require('../../validators/common.validator');
const {
  notificationQuerySchema,
  notificationIdParamSchema,
} = require('../../validators/notification.validator');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notifications for current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notifications list with unread count
 */
router.get('/', validate(notificationQuerySchema, 'query'), controller.getNotifications);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All marked as read
 */
// read-all must be registered BEFORE /:id to avoid route conflict
router.patch('/read-all', controller.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a single notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Not found
 */
router.patch('/:id/read', validate(notificationIdParamSchema, 'params'), controller.markAsRead);

module.exports = router;
