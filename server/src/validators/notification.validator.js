'use strict';

const { z } = require('zod');
const { objectIdSchema } = require('./common.validator');

const notificationQuerySchema = z.object({
  page: z.string().optional().default('1').transform((v) => Math.max(1, parseInt(v, 10))),
  limit: z.string().optional().default('20').transform((v) => Math.min(100, Math.max(1, parseInt(v, 10)))),
  isRead: z.enum(['true', 'false']).optional(),
});

const notificationIdParamSchema = z.object({
  id: objectIdSchema,
});

module.exports = { notificationQuerySchema, notificationIdParamSchema };
