'use strict';

const { AuditLog } = require('../models');
const { buildSkipLimit } = require('../utils/pagination');

/**
 * Create an audit log entry
 */
async function create(data) {
  return AuditLog.create(data);
}

/**
 * List audit logs for a workspace with pagination
 */
async function findByWorkspaceId(workspaceId, { page = 1, limit = 50, action, entityType } = {}) {
  const { skip } = buildSkipLimit(page, limit);
  const filter = { workspaceId };
  if (action) { filter.action = action; }
  if (entityType) { filter.entityType = entityType; }

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { logs, total };
}

module.exports = { create, findByWorkspaceId };
