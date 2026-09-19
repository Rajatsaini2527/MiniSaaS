'use strict';

const workspaceRepo = require('../repositories/workspace.repository');
const workspaceMemberRepo = require('../repositories/workspaceMember.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

/**
 * Create a workspace + add owner as member (no transaction — works on standalone MongoDB)
 */
async function createWorkspace({ name, description, slug }, userId) {
  const finalSlug = slug || generateSlug(name);

  const slugTaken = await workspaceRepo.slugExists(finalSlug);
  if (slugTaken) { throw ApiError.conflict(`Slug "${finalSlug}" is already taken`); }

  // Create workspace
  const ws = await workspaceRepo.create({ name, description, ownerId: userId, slug: finalSlug });

  // Add owner as member — if this fails the workspace still exists but has no owner member;
  // wrap in try/catch so we can clean up and surface the real error.
  try {
    await workspaceMemberRepo.create({ workspaceId: ws._id, userId, role: 'owner', joinedAt: new Date() });
  } catch (err) {
    // Rollback workspace creation to keep data consistent
    await workspaceRepo.softDelete(ws._id).catch(() => {});
    throw err;
  }

  auditLogRepo.create({
    userId,
    workspaceId: ws._id,
    action: 'create',
    entityType: 'Workspace',
    entityId: ws._id,
    metadata: { name: ws.name, slug: ws.slug },
  }).catch(() => {});

  return ws;
}

/**
 * List workspaces for a user
 */
async function getWorkspaces(userId, { page, limit }) {
  const { workspaces, total } = await workspaceRepo.findByUserId(userId, { page, limit });
  return { workspaces, pagination: buildPaginationMeta(total, page, limit) };
}

/**
 * Get a single workspace — user must be a member
 */
async function getWorkspaceById(workspaceId, userId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {throw ApiError.notFound('Workspace not found');}

  const member = await workspaceMemberRepo.findOne(workspaceId, userId);
  if (!member) {throw ApiError.forbidden('You are not a member of this workspace');}

  return workspace;
}

/**
 * Update workspace — must be owner or admin (enforced by route middleware)
 */
async function updateWorkspace(workspaceId, updates, userId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {throw ApiError.notFound('Workspace not found');}

  if (updates.slug && updates.slug !== workspace.slug) {
    const taken = await workspaceRepo.slugExists(updates.slug, workspaceId);
    if (taken) {throw ApiError.conflict(`Slug "${updates.slug}" is already taken`);}
  }

  const updated = await workspaceRepo.updateById(workspaceId, updates);

  auditLogRepo.create({
    userId,
    workspaceId,
    action: 'update',
    entityType: 'Workspace',
    entityId: workspaceId,
    metadata: updates,
  }).catch(() => {});

  return updated;
}

/**
 * Delete workspace — must be owner (enforced by route middleware)
 */
async function deleteWorkspace(workspaceId, userId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {throw ApiError.notFound('Workspace not found');}

  await workspaceRepo.softDelete(workspaceId);

  auditLogRepo.create({
    userId,
    workspaceId,
    action: 'delete',
    entityType: 'Workspace',
    entityId: workspaceId,
    metadata: { name: workspace.name },
  }).catch(() => {});
}

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
};
