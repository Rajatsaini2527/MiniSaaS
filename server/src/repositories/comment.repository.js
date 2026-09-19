'use strict';

const { Comment } = require('../models');
const { buildSkipLimit } = require('../utils/pagination');

/**
 * Create a comment
 */
async function create(data) {
  return Comment.create(data);
}

/**
 * Find comment by ID (not deleted)
 */
async function findById(id) {
  return Comment.findOne({ _id: id, deletedAt: null });
}

/**
 * List comments for a task with pagination
 */
async function findByTaskId(taskId, { page = 1, limit = 50 } = {}) {
  const { skip } = buildSkipLimit(page, limit);
  const [comments, total] = await Promise.all([
    Comment.find({ taskId, deletedAt: null })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Comment.countDocuments({ taskId, deletedAt: null }),
  ]);
  return { comments, total };
}

/**
 * Update comment content
 */
async function updateById(id, content) {
  return Comment.findByIdAndUpdate(
    id,
    { content, editedAt: new Date() },
    { new: true, runValidators: true }
  );
}

/**
 * Soft-delete a comment
 */
async function softDelete(id) {
  return Comment.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
}

module.exports = {
  create,
  findById,
  findByTaskId,
  updateById,
  softDelete,
};
