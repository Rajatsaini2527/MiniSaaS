'use strict';

const { z } = require('zod');

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  avatar: z.string().trim().url('Avatar must be a valid URL').max(500).nullable().optional(),
});

module.exports = { updateProfileSchema };
