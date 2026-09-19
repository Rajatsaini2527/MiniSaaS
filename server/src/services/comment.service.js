'use strict';

const commentRepo = require('../repositories/comment.repository');
const taskRepo = require('../repositories/task.repository');
const workspaceMemberRepo = require('../repositories/workspaceMember.repository');
const notificationRepo = require('../repositories/notification.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');
const { emitNotification } = require('../config/socket');

/**
 * Add a comment to a task (no transaction — works on standalone MongoDB)
 */
async function createComment({ taskId, workspaceId, content }, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }

  const task = await taskRepo.findById(taskId, workspaceId);
  if (!task) { throw ApiError.notFound('Task not found'); }

  const comment = await commentRepo.create({ taskId, userId, content });

  // Audit log (fire-and-forget)
  auditLogRepo.create({
    userId, workspaceId, action: 'create',
    entityType: 'Comment', entityId: comment._id,
    metadata: { taskId },
  }).catch(() => {});

  // Notify task reporter and assignee (excluding the commenter)
  const notifyIds = [
    task.reporterId?.toString(),
    task.assigneeId?.toString(),
  ].filter((id) => id && id !== userId.toString());

  const uniqueIds = [...new Set(notifyIds)];

  uniqueIds.forEach((uid) => {
    notificationRepo.create({
      userId: uid, type: 'comment_added',
      title: 'New comment on a task',
      message: `A new comment was added to task "${task.title}"`,
      entityType: 'Task', entityId: task._id,
    }).then((notif) => {
      if (notif) { emitNotification(uid, notif); }
    }).catch(() => {});
  });

  return comment;
}

async function getComments(taskId, workspaceId, userId, { page, limit }) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }

  const task = await taskRepo.findById(taskId, workspaceId);
  if (!task) { throw ApiError.notFound('Task not found'); }

  const { comments, total } = await commentRepo.findByTaskId(taskId, { page, limit });
  return { comments, pagination: buildPaginationMeta(total, page, limit) };
}

async function updateComment(commentId, content, userId) {
  const comment = await commentRepo.findById(commentId);
  if (!comment) { throw ApiError.notFound('Comment not found'); }
  if (comment.userId.toString() !== userId.toString()) {
    throw ApiError.forbidden('You can only edit your own comments');
  }
  return commentRepo.updateById(commentId, content);
}

async function deleteComment(commentId, userId, actorRole) {
  const comment = await commentRepo.findById(commentId);
  if (!comment) { throw ApiError.notFound('Comment not found'); }

  const isAuthor = comment.userId.toString() === userId.toString();
  const isPrivileged = actorRole === 'owner' || actorRole === 'admin';

  if (!isAuthor && !isPrivileged) {
    throw ApiError.forbidden('You do not have permission to delete this comment');
  }

  await commentRepo.softDelete(commentId);
}

module.exports = { createComment, getComments, updateComment, deleteComment };
