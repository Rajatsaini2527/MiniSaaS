'use strict';

const commentService = require('../../services/comment.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/tasks/:taskId/comments
 */
async function createComment(req, res, next) {
  try {
    const comment = await commentService.createComment(
      {
        taskId: req.params.taskId,
        workspaceId: req.query.workspaceId,
        content: req.body.content,
      },
      req.user._id
    );
    return res.status(201).json(ApiResponse.success(comment, 'Comment added'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/tasks/:taskId/comments?workspaceId=...
 */
async function getComments(req, res, next) {
  try {
    const { comments, pagination } = await commentService.getComments(
      req.params.taskId,
      req.query.workspaceId,
      req.user._id,
      { page: req.query.page || 1, limit: req.query.limit || 50 }
    );
    return res.status(200).json(ApiResponse.paginated(comments, pagination, 'Comments retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/comments/:id
 */
async function updateComment(req, res, next) {
  try {
    const comment = await commentService.updateComment(
      req.params.id,
      req.body.content,
      req.user._id
    );
    return res.status(200).json(ApiResponse.success(comment, 'Comment updated'));
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/comments/:id
 */
async function deleteComment(req, res, next) {
  try {
    const member = req.workspaceMember;
    await commentService.deleteComment(
      req.params.id,
      req.user._id,
      member ? member.role : 'member'
    );
    return res.status(200).json(ApiResponse.success(null, 'Comment deleted'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { createComment, getComments, updateComment, deleteComment };
