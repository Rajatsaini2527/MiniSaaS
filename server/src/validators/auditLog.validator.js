'use strict';

const { z } = require('zod');
const { objectIdSchema } = require('./common.validator');

const auditLogQuerySchema = z.object({
  page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10))),
  limit: z.string().optional().default('50').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10)))),
  action: z
    .enum(['login', 'logout', 'create', 'update', 'delete', 'assign', 'invite', 'status_change'])
    .optional(),
  entityType: z.string().trim().max(50).optional(),
});

const auditLogWorkspaceParamSchema = z.object({
  id: objectIdSchema,
});

module.exports = { auditLogQuerySchema, auditLogWorkspaceParamSchema };
