'use strict';

const { Workspace, WorkspaceMember } = require('../models');
const { buildSkipLimit } = require('../utils/pagination');

/**
 * Create a workspace
 */
async function create(data) {
  return Workspace.create(data);
}

/**
 * Find workspace by ID (not deleted)
 */
async function findById(id) {
  return Workspace.findOne({ _id: id, deletedAt: null });
}

/**
 * Find workspaces the user is a member of, with pagination
 */
async function findByUserId(userId, { page = 1, limit = 20 } = {}) {
  const { skip } = buildSkipLimit(page, limit);

  // Get workspace IDs the user belongs to
  const memberships = await WorkspaceMember.find({ userId }).select('workspaceId').lean();
  const workspaceIds = memberships.map((m) => m.workspaceId);

  const [workspaces, total] = await Promise.all([
    Workspace.find({ _id: { $in: workspaceIds }, deletedAt: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Workspace.countDocuments({ _id: { $in: workspaceIds }, deletedAt: null }),
  ]);

  return { workspaces, total };
}

/**
 * Update a workspace by ID
 */
async function updateById(id, updates) {
  return Workspace.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

/**
 * Soft-delete a workspace
 */
async function softDelete(id) {
  return Workspace.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
}

/**
 * Check if a slug is already taken
 */
async function slugExists(slug, excludeId = null) {
  const query = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return Workspace.exists(query);
}

module.exports = {
  create,
  findById,
  findByUserId,
  updateById,
  softDelete,
  slugExists,
};
