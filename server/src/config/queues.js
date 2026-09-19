'use strict';

const { Queue, Worker } = require('bullmq');
const { getRedisClient, isRedisConnected } = require('./redis');
const logger = require('../utils/logger');

const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATIONS: 'notifications',
  DAILY_SUMMARY: 'daily-summary',
  CLEANUP: 'cleanup',
};

let queues = {}; // eslint-disable-line prefer-const
let workers = {}; // eslint-disable-line prefer-const

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 200 },
};

/**
 * Initialize all BullMQ queues and workers.
 * No-op if Redis is not enabled.
 */
function initQueues() {
  if (!isRedisConnected()) {
    logger.info('BullMQ disabled — Redis not connected');
    return;
  }

  const connection = getRedisClient();

  // ── Create queues ────────────────────────────────────────────────────────
  Object.values(QUEUE_NAMES).forEach((name) => {
    queues[name] = new Queue(name, { connection, defaultJobOptions });
  });

  // ── Email worker ─────────────────────────────────────────────────────────
  workers[QUEUE_NAMES.EMAIL] = new Worker(
    QUEUE_NAMES.EMAIL,
    async (job) => {
      const { type, to, subject, html } = job.data;
      logger.info(`Processing email job: type=${type} to=${to}`);
      const emailService = require('../services/email.service');
      await emailService.sendEmail({ to, subject, html });
    },
    { connection }
  );

  // ── Notifications worker ─────────────────────────────────────────────────
  workers[QUEUE_NAMES.NOTIFICATIONS] = new Worker(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
      const { userId, type, title, message, entityType, entityId } = job.data;
      logger.info(`Processing notification job: type=${type} userId=${userId}`);
      const { Notification } = require('../models');
      const { emitNotification } = require('./socket');
      const notif = await Notification.create({ userId, type, title, message, entityType, entityId });
      emitNotification(userId, notif);
    },
    { connection }
  );

  // ── Daily summary worker ──────────────────────────────────────────────────
  workers[QUEUE_NAMES.DAILY_SUMMARY] = new Worker(
    QUEUE_NAMES.DAILY_SUMMARY,
    async (job) => {
      logger.info('Processing daily summary job', job.data);
      const { User, Task } = require('../models');
      const users = await User.find({ status: 'active', deletedAt: null }).select('_id email name').lean();
      const today = new Date(); today.setHours(23, 59, 59, 999);
      for (const user of users) {
        const overdue = await Task.countDocuments({
          assigneeId: user._id,
          dueDate: { $lt: today },
          status: { $ne: 'done' },
          deletedAt: null,
        });
        if (overdue > 0) {
          await addEmailJob({
            type: 'daily-summary',
            to: user.email,
            subject: `You have ${overdue} overdue task${overdue > 1 ? 's' : ''}`,
            html: `<p>Hi ${user.name},</p><p>You have <strong>${overdue}</strong> overdue task(s). Check your dashboard.</p>`,
          });
        }
      }
    },
    { connection }
  );

  // ── Cleanup worker ────────────────────────────────────────────────────────
  workers[QUEUE_NAMES.CLEANUP] = new Worker(
    QUEUE_NAMES.CLEANUP,
    async () => {
      logger.info('Running cleanup job: expired refresh tokens');
      const { RefreshToken } = require('../models');
      const result = await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
      logger.info(`Cleanup: deleted ${result.deletedCount} expired refresh tokens`);
    },
    { connection }
  );

  // ── Error handlers ────────────────────────────────────────────────────────
  Object.entries(workers).forEach(([name, worker]) => {
    worker.on('failed', (job, err) => {
      logger.error(`Queue [${name}] job ${job?.id} failed:`, err.message);
    });
    worker.on('completed', (job) => {
      logger.info(`Queue [${name}] job ${job.id} completed`);
    });
  });

  logger.info('BullMQ queues initialized:', Object.keys(queues).join(', '));

  // Schedule daily summary + cleanup
  scheduleDailyJobs();
}

function scheduleDailyJobs() {
  const summaryQueue = queues[QUEUE_NAMES.DAILY_SUMMARY];
  const cleanupQueue = queues[QUEUE_NAMES.CLEANUP];
  if (summaryQueue) {
    summaryQueue.add('daily-summary', {}, { repeat: { pattern: '0 8 * * *' } }).catch(() => {});
  }
  if (cleanupQueue) {
    cleanupQueue.add('cleanup', {}, { repeat: { pattern: '0 2 * * *' } }).catch(() => {});
  }
}

async function addEmailJob(data) {
  if (!queues[QUEUE_NAMES.EMAIL]) {
    // Fallback: log it
    logger.info('Email (no queue):', data.type, data.to);
    return;
  }
  return queues[QUEUE_NAMES.EMAIL].add(data.type || 'email', data);
}

async function addNotificationJob(data) {
  if (!queues[QUEUE_NAMES.NOTIFICATIONS]) { return null; }
  return queues[QUEUE_NAMES.NOTIFICATIONS].add('notification', data);
}

async function closeQueues() {
  for (const worker of Object.values(workers)) {
    await worker.close();
  }
  for (const queue of Object.values(queues)) {
    await queue.close();
  }
}

module.exports = {
  initQueues,
  addEmailJob,
  addNotificationJob,
  closeQueues,
  QUEUE_NAMES,
  getQueues: () => queues,
};
