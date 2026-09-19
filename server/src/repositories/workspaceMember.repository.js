'use strict';

const { WorkspaceMember } = require('../models');
const { buildSkipLimit } = require('../utils/pagination');

/**
 * Create a workspace member record
 */
async function create(data) {
  return WorkspaceMember.create(data);
}

/**
 * Find a specific membership
 */
async function findOne(workspaceId, userId) {
  return WorkspaceMember.findOne({ workspaceId, userId });
}

/**
 * Find a membership by its ID
 */
async function findById(id) {
  return WorkspaceMember.findById(id);
}

/**
 * List members of a workspace with pagination
 */
async function findByWorkspaceId(workspaceId, { page = 1, limit = 20 } = {}) {
  const { skip } = buildSkipLimit(page, limit);
  const [members, total] = await Promise.all([
    WorkspaceMember.find({ workspaceId })
      .populate('userId', 'name email avatar status')
      .sort({ joinedAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    WorkspaceMember.countDocuments({ workspaceId }),
  ]);
  return { members, total };
}

/**
 * Update a member's role
 */
async function updateRole(id, role) {
  return WorkspaceMember.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
}

/**
 * Remove a member from a workspace
 */
async function deleteById(id) {
  return WorkspaceMember.findByIdAndDelete(id);
}

/**
 * Count members in a workspace
 */
async function countByWorkspaceId(workspaceId) {
  return WorkspaceMember.countDocuments({ workspaceId });
}

module.exports = {
  create,
  findOne,
  findById,
  findByWorkspaceId,
  updateRole,
  deleteById,
  countByWorkspaceId,
};
