'use strict';

const { z } = require('zod');
const { objectIdSchema } = require('./common.validator');

const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(5000, 'Content too long'),
});

const updateCommentSchema = z.object({
  content: z.string().trim().min(1, 'Content is required').max(5000, 'Content too long'),
});

const commentParamSchema = z.object({
  taskId: objectIdSchema,
});

const commentIdParamSchema = z.object({
  id: objectIdSchema,
});

const commentQuerySchema = z.object({
  workspaceId: objectIdSchema,
  page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10))),
  limit: z.string().optional().default('50').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10)))),
});

module.exports = {
  createCommentSchema,
  updateCommentSchema,
  commentParamSchema,
  commentIdParamSchema,
  commentQuerySchema,
};
