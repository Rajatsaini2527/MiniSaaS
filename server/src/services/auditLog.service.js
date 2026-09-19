'use strict';

const auditLogRepo = require('../repositories/auditLog.repository');
const workspaceMemberRepo = require('../repositories/workspaceMember.repository');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');

/**
 * Get audit logs for a workspace — only owner/admin can view
 */
async function getAuditLogs(workspaceId, userId, { page, limit, action, entityType }) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) {throw ApiError.forbidden('You are not a member of this workspace');}
  if (member.role !== 'owner' && member.role !== 'admin') {
    throw ApiError.forbidden('Only owners and admins can view audit logs');
  }

  const { logs, total } = await auditLogRepo.findByWorkspaceId(workspaceId, {
    page,
    limit,
    action,
    entityType,
  });

  return { logs, pagination: buildPaginationMeta(total, page, limit) };
}

module.exports = { getAuditLogs };
