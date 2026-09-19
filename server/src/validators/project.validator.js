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
    // If only a date (YYYY-MM-DD), append time so it's a valid ISO string for MongoDB
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) { return `${val}T00:00:00.000Z`; }
    return val;
  })
  .pipe(z.string().datetime({ message: 'Invalid date' }).nullable().optional());

const createProjectSchema = z.object({
  workspaceId: objectIdSchema,
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  description: z.string().trim().max(1000).optional(),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key too long')
    .regex(/^[A-Z0-9]+$/, 'Key can only contain uppercase letters and numbers'),
  startDate: dateSchema,
  dueDate: dateSchema,
});

const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(1000).nullable().optional(),
    key: z.string().trim().toUpperCase().min(2).max(10).regex(/^[A-Z0-9]+$/).optional(),
    status: z.enum(['active', 'completed', 'archived']).optional(),
    startDate: dateSchema,
    dueDate: dateSchema,
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field required' });

const projectQuerySchema = z.object({
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
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

const projectParamSchema = z.object({
  id: objectIdSchema,
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
  projectParamSchema,
};
