'use strict';

const { Router } = require('express');
const controller = require('./project.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const { requireWorkspaceMember } = require('../../middlewares/authorize.middleware');
const { validate } = require('../../validators/common.validator');
const {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  projectParamSchema,
} = require('../../validators/project.validator');
const { objectIdSchema } = require('../../validators/common.validator');
const { z } = require('zod');

const router = Router();
router.use(authenticate);

// workspaceId required as query for single-resource routes
const workspaceQuerySchema = z.object({ workspaceId: objectIdSchema });

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workspaceId, name, key]
 *             properties:
 *               workspaceId:
 *                 type: string
 *               name:
 *                 type: string
 *               key:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/', validate(createProjectSchema), controller.createProject);

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects in a workspace
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, archived]
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
 *         description: List of projects
 */
router.get('/', validate(projectQuerySchema, 'query'), controller.getProjects);

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Project details
 */
router.get(
  '/:id',
  validate(projectParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  controller.getProjectById
);

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validate(projectParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  validate(updateProjectSchema),
  controller.updateProject
);

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (owner or admin only)
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  validate(projectParamSchema, 'params'),
  validate(workspaceQuerySchema, 'query'),
  requireWorkspaceMember,
  controller.deleteProject
);

module.exports = router;
