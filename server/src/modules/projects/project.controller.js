'use strict';

const projectService = require('../../services/project.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * POST /api/v1/projects
 */
async function createProject(req, res, next) {
  try {
    const project = await projectService.createProject(req.body, req.user._id);
    return res.status(201).json(ApiResponse.success(project, 'Project created'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/projects?workspaceId=...
 */
async function getProjects(req, res, next) {
  try {
    const { workspaceId, page, limit, status } = req.query;
    const { projects, pagination } = await projectService.getProjects(workspaceId, req.user._id, {
      page,
      limit,
      status,
    });
    return res.status(200).json(ApiResponse.paginated(projects, pagination, 'Projects retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/projects/:id?workspaceId=...
 */
async function getProjectById(req, res, next) {
  try {
    const project = await projectService.getProjectById(
      req.params.id,
      req.query.workspaceId,
      req.user._id
    );
    return res.status(200).json(ApiResponse.success(project, 'Project retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/projects/:id?workspaceId=...
 */
async function updateProject(req, res, next) {
  try {
    const project = await projectService.updateProject(
      req.params.id,
      req.query.workspaceId,
      req.body,
      req.user._id
    );
    return res.status(200).json(ApiResponse.success(project, 'Project updated'));
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/v1/projects/:id?workspaceId=...
 */
async function deleteProject(req, res, next) {
  try {
    const member = req.workspaceMember;
    await projectService.deleteProject(
      req.params.id,
      req.query.workspaceId,
      req.user._id,
      member ? member.role : 'member'
    );
    return res.status(200).json(ApiResponse.success(null, 'Project deleted'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };
