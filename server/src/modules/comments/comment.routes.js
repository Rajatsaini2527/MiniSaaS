'use strict';

const { Router } = require('express');
const controller = require('./comment.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const { requireWorkspaceMember: _requireWorkspaceMember } = require('../../middlewares/authorize.middleware');
const { validate } = require('../../validators/common.validator');
const {
  createCommentSchema,
  updateCommentSchema,
  commentParamSchema,
  commentIdParamSchema,
  commentQuerySchema,
} = require('../../validators/comment.validator');

// Two routers: task-scoped and standalone
const taskRouter = Router({ mergeParams: true });
const commentRouter = Router();

taskRouter.use(authenticate);
commentRouter.use(authenticate);

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
taskRouter.post(
  '/',
  validate(commentParamSchema, 'params'),
  validate(commentQuerySchema, 'query'),
  validate(createCommentSchema),
  controller.createComment
);

/**
 * @swagger
 * /tasks/{taskId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: List comments for a task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 */
taskRouter.get(
  '/',
  validate(commentParamSchema, 'params'),
  validate(commentQuerySchema, 'query'),
  controller.getComments
);

/**
 * @swagger
 * /comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Update a comment (author only)
 *     security:
 *       - bearerAuth: []
 */
commentRouter.put(
  '/:id',
  validate(commentIdParamSchema, 'params'),
  validate(updateCommentSchema),
  controller.updateComment
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment (author, admin, or owner)
 *     security:
 *       - bearerAuth: []
 */
commentRouter.delete('/:id', validate(commentIdParamSchema, 'params'), controller.deleteComment);

module.exports = { taskRouter, commentRouter };
