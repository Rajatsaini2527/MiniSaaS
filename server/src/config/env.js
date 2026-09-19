'use strict';

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10)),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_TEST_URI: z.string().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  // JWT
  JWT_ACCESS_SECRET: z.string().default('dev_access_secret_change_in_production'),
  JWT_REFRESH_SECRET: z.string().default('dev_refresh_secret_change_in_production'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_ENABLED: z.string().default('false').transform((v) => v === 'true'),
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587').transform((v) => parseInt(v, 10)),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@minisaas.app'),
  // File uploads
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE: z.string().default('5242880').transform((v) => parseInt(v, 10)), // 5 MB
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  process.stderr.write('❌ Invalid environment variables:\n');
  process.stderr.write(JSON.stringify(_parsed.error.flatten().fieldErrors, null, 2) + '\n');
  process.exit(1);
}

const env = _parsed.data;

module.exports = env;
