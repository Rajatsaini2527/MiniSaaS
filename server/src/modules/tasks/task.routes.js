'use strict';

const { Router } = require('express');
const controller = require('./task.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const { requireWorkspaceMember } = require('../../middlewares/authorize.middleware');
const { validate } = require('../../validators/common.validator');
const {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateTaskAssigneeSchema,
  taskQuerySchema,
  taskParamSchema,
} = require('../../validators/task.validator');
const { objectIdSchema } = require('../../validators/common.validator');
const { z } = require('zod');

const router = Router();
router.use(authenticate);

const workspaceQuerySchema = z.object({ workspaceId: objectIdSchema });

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workspaceId, projectId, title]
 *             properties:
 *               workspaceId:
 *                 type: string
 *               projectId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, done]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               assigneeId:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/', validate(createTaskSchema), controller.createTask);

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks in a workspace
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: assigneeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks
 */
router.get('/', validate(taskQuerySchema, 'query'), controller.getTasks);

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get a task by ID
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  validate(taskParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  controller.getTaskById
);

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validate(taskParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  validate(updateTaskSchema),
  controller.updateTask
);

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  validate(taskParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  requireWorkspaceMember,
  controller.deleteTask
);

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task status
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, done]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  '/:id/status',
  validate(taskParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  validate(updateTaskStatusSchema),
  controller.updateTaskStatus
);

/**
 * @swagger
 * /tasks/{id}/assignee:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task assignee
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assigneeId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Assignee updated
 */
router.patch(
  '/:id/assignee',
  validate(taskParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  validate(updateTaskAssigneeSchema),
  controller.updateTaskAssignee
);

module.exports = router;
