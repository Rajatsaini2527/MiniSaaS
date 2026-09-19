'use strict';

const { Task } = require('../models');
const { buildSkipLimit } = require('../utils/pagination');

/**
 * Create a task
 */
async function create(data) {
  return Task.create(data);
}

/**
 * Find task by ID (not deleted), scoped to workspace
 */
async function findById(id, workspaceId = null) {
  const query = { _id: id, deletedAt: null };
  if (workspaceId) {
    query.workspaceId = workspaceId;
  }
  return Task.findOne(query);
}

/**
 * List tasks with filters and pagination
 */
async function findMany(workspaceId, { page = 1, limit = 20, projectId, status, priority, assigneeId, search } = {}) {
  const { skip } = buildSkipLimit(page, limit);
  const filter = { workspaceId, deletedAt: null };

  if (projectId) { filter.projectId = projectId; }
  if (status) { filter.status = status; }
  if (priority) { filter.priority = priority; }
  if (assigneeId) { filter.assigneeId = assigneeId; }

  let query = Task.find(filter);

  if (search) {
    query = Task.find({ ...filter, $text: { $search: search } });
  }

  const [tasks, total] = await Promise.all([
    query
      .sort({ position: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assigneeId', 'name email avatar')
      .populate('reporterId', 'name email avatar')
      .lean(),
    Task.countDocuments(search ? { ...filter, $text: { $search: search } } : filter),
  ]);

  return { tasks, total };
}

/**
 * Update a task by ID
 */
async function updateById(id, updates) {
  return Task.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

/**
 * Soft-delete a task
 */
async function softDelete(id) {
  return Task.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
}

/**
 * Get max position for a project/status combo
 */
async function getMaxPosition(projectId, status) {
  const task = await Task.findOne({ projectId, status, deletedAt: null })
    .sort({ position: -1 })
    .select('position')
    .lean();
  return task ? task.position : 0;
}

module.exports = {
  create,
  findById,
  findMany,
  updateById,
  softDelete,
  getMaxPosition,
};
