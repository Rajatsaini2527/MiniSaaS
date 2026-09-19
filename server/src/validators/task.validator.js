'use strict';

const { z } = require('zod');
const { objectIdSchema } = require('./common.validator');

// Accepts both "YYYY-MM-DD" (from <input type="date">) and full ISO datetime
const dateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => {
    if (!val) { return null; }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) { return `${val}T00:00:00.000Z`; }
    return val;
  })
  .pipe(z.string().datetime({ message: 'Invalid date' }).nullable().optional());

const createTaskSchema = z.object({
  workspaceId: objectIdSchema,
  projectId: objectIdSchema,
  title: z.string().trim().min(1, 'Title is required').max(500, 'Title too long'),
  description: z.string().trim().max(10000).optional().nullable(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigneeId: objectIdSchema.optional().nullable(),
  dueDate: dateSchema,
});

const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    dueDate: dateSchema,
    position: z.number().int().min(0).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'At least one field required' });

const updateTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
});

const updateTaskAssigneeSchema = z.object({
  assigneeId: objectIdSchema.nullable(),
});

const taskQuerySchema = z.object({
  workspaceId: objectIdSchema,
  page: z
    .string()
    .optional()
    .default('1')
    .transform((v) => Math.max(1, parseInt(v, 10))),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((v) => Math.min(100, Math.max(1, parseInt(v, 10)))),
  projectId: objectIdSchema.optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigneeId: objectIdSchema.optional(),
  search: z.string().trim().max(200).optional(),
});

const taskParamSchema = z.object({
  id: objectIdSchema,
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  updateTaskAssigneeSchema,
  taskQuerySchema,
  taskParamSchema,
};
