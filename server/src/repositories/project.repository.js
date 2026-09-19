'use strict';

const { Project } = require('../models');
const { buildSkipLimit } = require('../utils/pagination');

/**
 * Create a project
 */
async function create(data) {
  return Project.create(data);
}

/**
 * Find a project by ID (not deleted), must belong to workspaceId
 */
async function findById(id, workspaceId = null) {
  const query = { _id: id, deletedAt: null };
  if (workspaceId) {
    query.workspaceId = workspaceId;
  }
  return Project.findOne(query);
}

/**
 * List projects in a workspace with pagination
 */
async function findByWorkspaceId(workspaceId, { page = 1, limit = 20, status } = {}) {
  const { skip } = buildSkipLimit(page, limit);
  const filter = { workspaceId, deletedAt: null };
  if (status) {
    filter.status = status;
  }
  const [projects, total] = await Promise.all([
    Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(filter),
  ]);
  return { projects, total };
}

/**
 * Update a project
 */
async function updateById(id, updates) {
  return Project.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

/**
 * Soft-delete a project
 */
async function softDelete(id) {
  return Project.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
}

/**
 * Check if key exists in workspace
 */
async function keyExistsInWorkspace(workspaceId, key, excludeId = null) {
  const query = { workspaceId, key: key.toUpperCase(), deletedAt: null };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  return Project.exists(query);
}

module.exports = {
  create,
  findById,
  findByWorkspaceId,
  updateById,
  softDelete,
  keyExistsInWorkspace,
};
