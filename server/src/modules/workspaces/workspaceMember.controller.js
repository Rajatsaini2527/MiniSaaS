'use strict';

const workspaceMemberService = require('../../services/workspaceMember.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/workspaces/:id/members
 */
async function addMember(req, res, next) {
  try {
    const member = await workspaceMemberService.addMember(
      { workspaceId: req.params.id, ...req.body },
      req.user._id
    );
    return res.status(201).json(ApiResponse.success(member, 'Member added to workspace'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/workspaces/:id/members
 */
async function getMembers(req, res, next) {
  try {
    const { members, pagination } = await workspaceMemberService.getMembers(req.params.id, {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    });
    return res.status(200).json(ApiResponse.paginated(members, pagination, 'Members retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/workspaces/:id/members/:memberId
 */
async function updateMemberRole(req, res, next) {
  try {
    const member = await workspaceMemberService.updateMemberRole(
      { workspaceId: req.params.id, memberId: req.params.memberId, ...req.body },
      req.user._id,
      req.workspaceMember.role
    );
    return res.status(200).json(ApiResponse.success(member, 'Member role updated'));
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/workspaces/:id/members/:memberId
 */
async function removeMember(req, res, next) {
  try {
    await workspaceMemberService.removeMember(
      { workspaceId: req.params.id, memberId: req.params.memberId },
      req.user._id,
      req.workspaceMember.role
    );
    return res.status(200).json(ApiResponse.success(null, 'Member removed from workspace'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { addMember, getMembers, updateMemberRole, removeMember };
