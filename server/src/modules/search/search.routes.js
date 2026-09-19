'use strict';

const { Router } = require('express');
const { globalSearch } = require('./search.controller');
const authenticate = require('../../middlewares/authenticate.middleware');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Global search across users, workspaces, projects and tasks
 *     description: |
 *       Searches all entities the authenticated user has access to.
 *       Results are scoped to workspaces the user belongs to.
 *       Minimum query length: 2 characters.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         example: auth
 *         description: Search query (min 2 chars)
 *       - in: query
 *         name: workspaceId
 *         schema:
 *           type: string
 *         description: Scope results to a specific workspace (optional)
 *     responses:
 *       200:
 *         description: Categorized search results
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/User'
 *                         workspaces:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Workspace'
 *                         projects:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Project'
 *                         tasks:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Task'
 *             example:
 *               success: true
 *               message: "Found 3 results"
 *               data:
 *                 users: []
 *                 workspaces: []
 *                 projects: [{ _id: "...", name: "Auth Service", key: "AUTH" }]
 *                 tasks: [{ _id: "...", title: "Fix auth bug", status: "todo" }]
 *       400:
 *         description: Query too short
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', globalSearch);

module.exports = router;
