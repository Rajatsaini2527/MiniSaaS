'use strict';

const taskService = require('../../services/task.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/tasks
 */
async function createTask(req, res, next) {
  try {
    const task = await taskService.createTask(req.body, req.user._id);
    return res.status(201).json(ApiResponse.success(task, 'Task created'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/tasks?workspaceId=...
 */
async function getTasks(req, res, next) {
  try {
    const { workspaceId, page, limit, projectId, status, priority, assigneeId, search } = req.query;
    const { tasks, pagination } = await taskService.getTasks(workspaceId, req.user._id, {
      page,
      limit,
      projectId,
      status,
      priority,
      assigneeId,
      search,
    });
    return res.status(200).json(ApiResponse.paginated(tasks, pagination, 'Tasks retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/tasks/:id?workspaceId=...
 */
async function getTaskById(req, res, next) {
  try {
    const task = await taskService.getTaskById(req.params.id, req.query.workspaceId, req.user._id);
    return res.status(200).json(ApiResponse.success(task, 'Task retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/tasks/:id
 */
async function updateTask(req, res, next) {
  try {
    const task = await taskService.updateTask(
      req.params.id,
      req.query.workspaceId,
      req.body,
      req.user._id
    );
    return res.status(200).json(ApiResponse.success(task, 'Task updated'));
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/tasks/:id?workspaceId=...
 */
async function deleteTask(req, res, next) {
  try {
    const member = req.workspaceMember;
    await taskService.deleteTask(
      req.params.id,
      req.query.workspaceId,
      req.user._id,
      member ? member.role : 'member'
    );
    return res.status(200).json(ApiResponse.success(null, 'Task deleted'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/tasks/:id/status
 */
async function updateTaskStatus(req, res, next) {
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.query.workspaceId,
      req.body.status,
      req.user._id
    );
    return res.status(200).json(ApiResponse.success(task, 'Task status updated'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PATCH /api/v1/tasks/:id/assignee
 */
async function updateTaskAssignee(req, res, next) {
  try {
    const task = await taskService.updateTaskAssignee(
      req.params.id,
      req.query.workspaceId,
      req.body.assigneeId,
      req.user._id
    );
    return res.status(200).json(ApiResponse.success(task, 'Task assignee updated'));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskAssignee,
};
