'use strict';

const auditLogService = require('../../services/auditLog.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * GET /api/v1/workspaces/:id/audit-logs
 */
async function getAuditLogs(req, res, next) {
  try {
    const { logs, pagination } = await auditLogService.getAuditLogs(
      req.params.id,
      req.user._id,
      {
        page: req.query.page || 1,
        limit: req.query.limit || 50,
        action: req.query.action,
        entityType: req.query.entityType,
      }
    );
    return res.status(200).json(ApiResponse.paginated(logs, pagination, 'Audit logs retrieved'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { getAuditLogs };
