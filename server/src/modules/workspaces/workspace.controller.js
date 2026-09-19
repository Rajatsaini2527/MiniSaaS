'use strict';

const workspaceService = require('../../services/workspace.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/workspaces
 */
async function createWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.createWorkspace(req.body, req.user._id);
    return res.status(201).json(ApiResponse.success(workspace, 'Workspace created'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/workspaces
 */
async function getWorkspaces(req, res, next) {
  try {
    const { workspaces, pagination } = await workspaceService.getWorkspaces(req.user._id, {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    });
    return res.status(200).json(ApiResponse.paginated(workspaces, pagination, 'Workspaces retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/workspaces/:id
 */
async function getWorkspaceById(req, res, next) {
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id, req.user._id);
    return res.status(200).json(ApiResponse.success(workspace, 'Workspace retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/workspaces/:id
 */
async function updateWorkspace(req, res, next) {
  try {
    const workspace = await workspaceService.updateWorkspace(req.params.id, req.body, req.user._id);
    return res.status(200).json(ApiResponse.success(workspace, 'Workspace updated'));
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/workspaces/:id
 */
async function deleteWorkspace(req, res, next) {
  try {
    await workspaceService.deleteWorkspace(req.params.id, req.user._id);
    return res.status(200).json(ApiResponse.success(null, 'Workspace deleted'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { createWorkspace, getWorkspaces, getWorkspaceById, updateWorkspace, deleteWorkspace };
