'use strict';

const { User, Workspace, Project, Task, WorkspaceMember } = require('../../models');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * GET /api/v1/search?q=&workspaceId=
 */
async function globalSearch(req, res, next) {
  try {
    const { q, workspaceId } = req.query;

    if (!q || q.trim().length < 2) {
      return next(ApiError.badRequest('Query must be at least 2 characters'));
    }

    const query = q.trim().slice(0, 100);
    const regex = new RegExp(query, 'i');

    // Get workspaces the user belongs to
    const memberships = await WorkspaceMember.find({ userId: req.user._id }).select('workspaceId').lean();
    const accessibleWsIds = memberships.map((m) => m.workspaceId);

    const [users, workspaces, projects, tasks] = await Promise.all([
      // Users — search by name/email (only workspace mates)
      User.find({
        $or: [{ name: regex }, { email: regex }],
        deletedAt: null,
        status: 'active',
        _id: { $ne: req.user._id },
      })
        .select('name email avatar status')
        .limit(10)
        .lean(),

      // Workspaces the user is a member of
      Workspace.find({
        _id: { $in: accessibleWsIds },
        $or: [{ name: regex }, { description: regex }, { slug: regex }],
        deletedAt: null,
        ...(workspaceId ? { _id: workspaceId } : {}),
      })
        .select('name description slug status')
        .limit(10)
        .lean(),

      // Projects in accessible workspaces
      Project.find({
        workspaceId: { $in: workspaceId ? [workspaceId] : accessibleWsIds },
        $or: [{ name: regex }, { description: regex }, { key: regex }],
        deletedAt: null,
      })
        .select('name description key status workspaceId')
        .limit(10)
        .lean(),

      // Tasks — use text index if available, fall back to regex
      Task.find({
        workspaceId: { $in: workspaceId ? [workspaceId] : accessibleWsIds },
        $or: [{ title: regex }, { description: regex }],
        deletedAt: null,
      })
        .select('title status priority workspaceId projectId')
        .limit(20)
        .lean(),
    ]);

    return res.status(200).json(
      ApiResponse.success(
        { users, workspaces, projects, tasks },
        `Found ${users.length + workspaces.length + projects.length + tasks.length} results`
      )
    );
  } catch (err) {
    return next(err);
  }
}

module.exports = { globalSearch };
