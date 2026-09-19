'use strict';

const projectRepo = require('../repositories/project.repository');
const workspaceMemberRepo = require('../repositories/workspaceMember.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');

/**
 * Create a project inside a workspace
 */
async function createProject({ workspaceId, name, description, key, startDate, dueDate }, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) {throw ApiError.forbidden('You are not a member of this workspace');}
  if (member.role === 'guest') {throw ApiError.forbidden('Guests cannot create projects');}

  const keyUpper = key.toUpperCase();
  const keyTaken = await projectRepo.keyExistsInWorkspace(workspaceId, keyUpper);
  if (keyTaken) {throw ApiError.conflict(`Project key "${keyUpper}" already exists in this workspace`);}

  const project = await projectRepo.create({
    workspaceId,
    ownerId: userId,
    name,
    description,
    key: keyUpper,
    startDate: startDate || null,
    dueDate: dueDate || null,
  });

  auditLogRepo.create({
    userId,
    workspaceId,
    action: 'create',
    entityType: 'Project',
    entityId: project._id,
    metadata: { name, key: keyUpper },
  }).catch(() => {});

  return project;
}

/**
 * List projects in a workspace
 */
async function getProjects(workspaceId, userId, { page, limit, status }) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) {throw ApiError.forbidden('You are not a member of this workspace');}

  const { projects, total } = await projectRepo.findByWorkspaceId(workspaceId, { page, limit, status });
  return { projects, pagination: buildPaginationMeta(total, page, limit) };
}

/**
 * Get a single project
 */
async function getProjectById(projectId, workspaceId, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) {throw ApiError.forbidden('You are not a member of this workspace');}

  const project = await projectRepo.findById(projectId, workspaceId);
  if (!project) {throw ApiError.notFound('Project not found');}

  return project;
}

/**
 * Update a project
 */
async function updateProject(projectId, workspaceId, updates, userId) {
  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) {throw ApiError.forbidden('You are not a member of this workspace');}
  if (member.role === 'guest') {throw ApiError.forbidden('Guests cannot update projects');}

  const project = await projectRepo.findById(projectId, workspaceId);
  if (!project) {throw ApiError.notFound('Project not found');}

  if (updates.key) {
    const keyUpper = updates.key.toUpperCase();
    if (keyUpper !== project.key) {
      const taken = await projectRepo.keyExistsInWorkspace(workspaceId, keyUpper, projectId);
      if (taken) {throw ApiError.conflict(`Project key "${keyUpper}" already exists`);}
    }
    updates.key = keyUpper;
  }

  const updated = await projectRepo.updateById(projectId, updates);

  auditLogRepo.create({
    userId,
    workspaceId,
    action: 'update',
    entityType: 'Project',
    entityId: projectId,
    metadata: updates,
  }).catch(() => {});

  return updated;
}

/**
 * Soft-delete a project
 */
async function deleteProject(projectId, workspaceId, userId, actorRole) {
  if (actorRole === 'guest' || actorRole === 'member') {
    throw ApiError.forbidden('Insufficient permissions to delete a project');
  }

  const project = await projectRepo.findById(projectId, workspaceId);
  if (!project) {throw ApiError.notFound('Project not found');}

  await projectRepo.softDelete(projectId);

  auditLogRepo.create({
    userId,
    workspaceId,
    action: 'delete',
    entityType: 'Project',
    entityId: projectId,
    metadata: { name: project.name },
  }).catch(() => {});
}

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };
