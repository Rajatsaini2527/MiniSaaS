'use strict';

const { WorkspaceMember } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * RBAC middleware factory.
 * Checks the requesting user's role in the workspace.
 *
 * Expects:
 *  - req.user to be set by authenticate middleware
 *  - req.params.id or req.params.workspaceId to be the workspace ID
 *  - req.workspaceMember to be optionally pre-loaded
 *
 * Usage:
 *   router.delete('/:id', authenticate, requireRole('owner', 'admin'), handler)
 *
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
  return async (req, _res, next) => {
    try {
      const workspaceId = req.params.workspaceId || req.params.id;
      if (!workspaceId) {
        return next(ApiError.badRequest('Workspace ID is required'));
      }

      const member = await WorkspaceMember.findOne({
        workspaceId,
        userId: req.user._id,
      });

      if (!member) {
        return next(ApiError.forbidden('You are not a member of this workspace'));
      }

      if (!roles.includes(member.role)) {
        return next(
          ApiError.forbidden(`Required role: ${roles.join(' or ')}. Your role: ${member.role}`)
        );
      }

      // Attach member info to req for downstream use
      req.workspaceMember = member;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

/**
 * Middleware to verify the user is a member of the workspace (any role).
 * Resolves workspaceId from req.params or req.body.
 */
async function requireWorkspaceMember(req, _res, next) {
  try {
    // Priority: query > body > params (params.id is often the resource id, not workspace)
    const workspaceId =
      req.query.workspaceId ||
      req.body.workspaceId ||
      req.params.workspaceId ||
      req.params.id;

    if (!workspaceId) {
      return next(ApiError.badRequest('Workspace ID is required'));
    }

    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user._id,
    });

    if (!member) {
      return next(ApiError.forbidden('You are not a member of this workspace'));
    }

    req.workspaceMember = member;
    req.workspaceId = workspaceId;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireRole, requireWorkspaceMember };
