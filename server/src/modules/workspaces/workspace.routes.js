'use strict';

const { Router } = require('express');
const wsCtrl = require('./workspace.controller');
const memberCtrl = require('./workspaceMember.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const { requireRole, requireWorkspaceMember } = require('../../middlewares/authorize.middleware');
const { validate } = require('../../validators/common.validator');
const {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  workspaceIdParamSchema,
  memberIdParamSchema,
} = require('../../validators/workspace.validator');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /workspaces:
 *   post:
 *     tags: [Workspaces]
 *     summary: Create a workspace
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               slug:
 *                 type: string
 *     responses:
 *       201:
 *         description: Workspace created
 */
router.post('/', validate(createWorkspaceSchema), wsCtrl.createWorkspace);

/**
 * @swagger
 * /workspaces:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspaces for current user
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: List of workspaces
 */
router.get('/', wsCtrl.getWorkspaces);

/**
 * @swagger
 * /workspaces/{id}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Get a workspace by ID
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
 *         description: Workspace details
 *       403:
 *         description: Not a member
 *       404:
 *         description: Not found
 */
router.get('/:id', validate(workspaceIdParamSchema, 'params'), wsCtrl.getWorkspaceById);

/**
 * @swagger
 * /workspaces/{id}:
 *   put:
 *     tags: [Workspaces]
 *     summary: Update a workspace (owner or admin only)
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validate(workspaceIdParamSchema, 'params'),
  requireRole('owner', 'admin'),
  validate(updateWorkspaceSchema),
  wsCtrl.updateWorkspace
);

/**
 * @swagger
 * /workspaces/{id}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Delete a workspace (owner only)
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  validate(workspaceIdParamSchema, 'params'),
  requireRole('owner'),
  wsCtrl.deleteWorkspace
);

// ── Members ──────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /workspaces/{id}/members:
 *   post:
 *     tags: [Workspace Members]
 *     summary: Add a member (owner or admin only)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/members',
  validate(workspaceIdParamSchema, 'params'),
  requireRole('owner', 'admin'),
  validate(addMemberSchema),
  memberCtrl.addMember
);

/**
 * @swagger
 * /workspaces/{id}/members:
 *   get:
 *     tags: [Workspace Members]
 *     summary: List workspace members
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/members',
  validate(workspaceIdParamSchema, 'params'),
  requireWorkspaceMember,
  memberCtrl.getMembers
);

/**
 * @swagger
 * /workspaces/{id}/members/{memberId}:
 *   put:
 *     tags: [Workspace Members]
 *     summary: Update member role (owner or admin only)
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id/members/:memberId',
  validate(memberIdParamSchema, 'params'),
  requireRole('owner', 'admin'),
  validate(updateMemberRoleSchema),
  memberCtrl.updateMemberRole
);

/**
 * @swagger
 * /workspaces/{id}/members/{memberId}:
 *   delete:
 *     tags: [Workspace Members]
 *     summary: Remove a member
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id/members/:memberId',
  validate(memberIdParamSchema, 'params'),
  requireWorkspaceMember,
  memberCtrl.removeMember
);

/**
 * @swagger
 * /workspaces/{id}/audit-logs:
 *   get:
 *     tags: [Audit Logs]
 *     summary: Get audit logs for a workspace (owner or admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of audit log entries
 *       403:
 *         description: Insufficient permissions
 */
const auditLogCtrl = require('../auditLogs/auditLog.controller');
const { validate: v } = require('../../validators/common.validator');
const { auditLogQuerySchema } = require('../../validators/auditLog.validator');

router.get(
  '/:id/audit-logs',
  validate(workspaceIdParamSchema, 'params'),
  requireWorkspaceMember,
  v(auditLogQuerySchema, 'query'),
  auditLogCtrl.getAuditLogs
);

module.exports = router;
