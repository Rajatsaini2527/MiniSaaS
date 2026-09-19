'use strict';

const { z } = require('zod');
const { objectIdSchema } = require('./common.validator');

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().trim().max(500, 'Description too long').optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .min(2)
    .max(50)
    .optional(),
});

const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .min(2)
    .max(50)
    .optional(),
  status: z.enum(['active', 'archived']).optional(),
}).refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

const addMemberSchema = z.object({
  email: z.string().trim().email('Invalid email'),
  role: z.enum(['admin', 'member', 'guest']).optional().default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'guest']),
});

const workspaceIdParamSchema = z.object({
  id: objectIdSchema,
});

const memberIdParamSchema = z.object({
  id: objectIdSchema,
  memberId: objectIdSchema,
});

module.exports = {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  workspaceIdParamSchema,
  memberIdParamSchema,
};
