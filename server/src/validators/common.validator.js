'use strict';

const { z } = require('zod');
const mongoose = require('mongoose');

/**
 * Zod schema for MongoDB ObjectId strings
 */
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid MongoDB ObjectId',
  });

/**
 * Zod schema for pagination query params
 */
const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => Math.max(1, parseInt(val, 10))),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => Math.min(100, Math.max(1, parseInt(val, 10)))),
});

/**
 * Zod schema for sort order
 */
const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

/**
 * Validate middleware factory using Zod schema
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} source - Request property to validate
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: result.error.flatten().fieldErrors,
      });
    }
    req[source] = result.data;
    return next();
  };
}

module.exports = {
  objectIdSchema,
  paginationSchema,
  sortOrderSchema,
  validate,
};
