'use strict';

const taskRepo = require('../repositories/task.repository');
const projectRepo = require('../repositories/project.repository');
const workspaceMemberRepo = require('../repositories/workspaceMember.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const notificationRepo = require('../repositories/notification.repository');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');
const { invalidateWorkspace } = require('./cache.service');
const { emitTaskEvent, emitNotification } = require('../config/socket');

async function _postWrite(event, task) {
  emitTaskEvent(event, task);
  invalidateWorkspace(
    task.workspaceId?.toString(),
    task.projectId?.toString()
  ).catch(() => {});
}

async function createTask({ workspaceId, projectId, title, description, status, priority, assigneeId, dueDate }, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }
  if (member.role === 'guest') { throw ApiError.forbidden('Guests cannot create tasks'); }

  const project = await projectRepo.findById(projectId, workspaceId);
  if (!project) { throw ApiError.notFound('Project not found'); }

  const maxPosition = await taskRepo.getMaxPosition(projectId, status || 'todo');

  // Create task (no transaction — works on standalone MongoDB)
  const task = await taskRepo.create({
    workspaceId,
    projectId,
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    assigneeId: assigneeId || null,
    reporterId: userId,
    dueDate: dueDate || null,
    position: maxPosition + 1,
  });

  // Audit log (fire-and-forget)
  auditLogRepo.create({
    userId, workspaceId, action: 'create',
    entityType: 'Task', entityId: task._id,
    metadata: { title, projectId },
  }).catch(() => {});

  // Notify assignee (fire-and-forget + socket)
  if (assigneeId && assigneeId.toString() !== userId.toString()) {
    notificationRepo.create({
      userId: assigneeId, type: 'task_assigned',
      title: 'Task assigned to you',
      message: `You have been assigned to task "${title}"`,
      entityType: 'Task', entityId: task._id,
    }).then((notif) => {
      if (notif) { emitNotification(assigneeId.toString(), notif); }
    }).catch(() => {});
  }

  _postWrite('task.created', task);
  return task;
}

async function getTasks(workspaceId, userId, filters) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }
  const { tasks, total } = await taskRepo.findMany(workspaceId, filters);
  return { tasks, pagination: buildPaginationMeta(total, filters.page, filters.limit) };
}

async function getTaskById(taskId, workspaceId, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }
  const task = await taskRepo.findById(taskId, workspaceId);
  if (!task) { throw ApiError.notFound('Task not found'); }
  return task;
}

async function updateTask(taskId, workspaceId, updates, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }
  if (member.role === 'guest') { throw ApiError.forbidden('Guests cannot update tasks'); }

  const task = await taskRepo.findById(taskId, workspaceId);
  if (!task) { throw ApiError.notFound('Task not found'); }

  const updated = await taskRepo.updateById(taskId, updates);

  auditLogRepo.create({ userId, workspaceId, action: 'update', entityType: 'Task', entityId: taskId, metadata: updates }).catch(() => {});
  _postWrite('task.updated', updated);
  return updated;
}

async function updateTaskStatus(taskId, workspaceId, status, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }
  if (member.role === 'guest') { throw ApiError.forbidden('Guests cannot update tasks'); }

  const task = await taskRepo.findById(taskId, workspaceId);
  if (!task) { throw ApiError.notFound('Task not found'); }

  const updated = await taskRepo.updateById(taskId, { status });

  auditLogRepo.create({
    userId, workspaceId, action: 'status_change',
    entityType: 'Task', entityId: taskId,
    metadata: { previousStatus: task.status, newStatus: status },
  }).catch(() => {});

  _postWrite('task.statusChanged', { ...updated.toObject?.() ?? updated, previousStatus: task.status });

  if (task.assigneeId && task.assigneeId.toString() !== userId.toString()) {
    notificationRepo.create({
      userId: task.assigneeId, type: 'task_updated',
      title: 'Task status updated',
      message: `Task "${task.title}" status changed to ${status}`,
      entityType: 'Task', entityId: taskId,
    }).then((notif) => {
      if (notif) { emitNotification(task.assigneeId.toString(), notif); }
    }).catch(() => {});
  }

  return updated;
}

async function updateTaskAssignee(taskId, workspaceId, assigneeId, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) { throw ApiError.forbidden('You are not a member of this workspace'); }
  if (member.role === 'guest') { throw ApiError.forbidden('Guests cannot assign tasks'); }

  const task = await taskRepo.findById(taskId, workspaceId);
  if (!task) { throw ApiError.notFound('Task not found'); }

  if (assigneeId) {
    const assigneeMember = await workspaceMemberRepo.findOne(workspaceId, assigneeId);
    if (!assigneeMember) { throw ApiError.badRequest('Assignee is not a member of this workspace'); }
  }

  const updated = await taskRepo.updateById(taskId, { assigneeId: assigneeId || null });

  auditLogRepo.create({ userId, workspaceId, action: 'assign', entityType: 'Task', entityId: taskId, metadata: { assigneeId } }).catch(() => {});
  _postWrite('task.updated', updated);

  if (assigneeId && assigneeId.toString() !== userId.toString()) {
    notificationRepo.create({
      userId: assigneeId, type: 'task_assigned',
      title: 'Task assigned to you',
      message: `You have been assigned to task "${task.title}"`,
      entityType: 'Task', entityId: taskId,
    }).then((notif) => {
      if (notif) { emitNotification(assigneeId.toString(), notif); }
    }).catch(() => {});
  }

  return updated;
}

async function deleteTask(taskId, workspaceId, userId, actorRole) {
  if (actorRole === 'guest') { throw ApiError.forbidden('Guests cannot delete tasks'); }

  const task = await taskRepo.findById(taskId, workspaceId);
  if (!task) { throw ApiError.notFound('Task not found'); }

  await taskRepo.softDelete(taskId);

  auditLogRepo.create({ userId, workspaceId, action: 'delete', entityType: 'Task', entityId: taskId, metadata: { title: task.title } }).catch(() => {});
  _postWrite('task.deleted', { _id: taskId, workspaceId, projectId: task.projectId });
}

module.exports = { createTask, getTasks, getTaskById, updateTask, updateTaskStatus, updateTaskAssignee, deleteTask };
