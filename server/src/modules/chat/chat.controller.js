'use strict';

const { Message } = require('../../models');
const workspaceMemberRepo = require('../../repositories/workspaceMember.repository');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * GET /api/v1/chat/:workspaceId/messages
 */
async function getMessages(req, res, next) {
  try {
    const { workspaceId } = req.params;
    const { projectId, before, limit = 50 } = req.query;

    const member = await workspaceMemberRepo.findOne(workspaceId, req.user._id);
    if (!member) { return next(ApiError.forbidden('Not a workspace member')); }

    const filter = { workspaceId, deletedAt: null };
    if (projectId) { filter.projectId = projectId; }
    else { filter.projectId = null; } // workspace-level chat only
    if (before) { filter.createdAt = { $lt: new Date(before) }; }

    const messages = await Message.find(filter)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit, 10) || 50, 100))
      .lean();

    return res.status(200).json(
      ApiResponse.success(messages.reverse(), 'Messages retrieved')
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/chat/messages/:id
 */
async function deleteMessage(req, res, next) {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) { return next(ApiError.notFound('Message not found')); }
    if (msg.userId.toString() !== req.user._id.toString()) {
      return next(ApiError.forbidden('You can only delete your own messages'));
    }
    await Message.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    return res.status(200).json(ApiResponse.success(null, 'Message deleted'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMessages, deleteMessage };
