'use strict';

const workspaceMemberRepo = require('../repositories/workspaceMember.repository');
const workspaceRepo = require('../repositories/workspace.repository');
const userRepo = require('../repositories/user.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const ApiError = require('../utils/ApiError');
const { buildPaginationMeta } = require('../utils/pagination');
const { createAndEmit } = require('./notification.service');
const { addEmailJob } = require('../config/queues');

async function addMember({ workspaceId, email, role }, actorId) {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) { throw ApiError.notFound('Workspace not found'); }

  const targetUser = await userRepo.findByEmail(email);
  if (!targetUser) { throw ApiError.notFound('User not found with that email'); }

  const existing = await workspaceMemberRepo.findOne(workspaceId, targetUser._id);
  if (existing) { throw ApiError.conflict('User is already a member of this workspace'); }

  const actor = await userRepo.findById(actorId);

  const member = await workspaceMemberRepo.create({
    workspaceId,
    userId: targetUser._id,
    role: role || 'member',
    joinedAt: new Date(),
  });

  // Notification (socket + DB)
  createAndEmit({
    userId: targetUser._id,
    type: 'workspace_invite',
    title: 'Workspace invitation',
    message: `You have been added to workspace "${workspace.name}"`,
    entityType: 'Workspace',
    entityId: workspace._id,
  }).catch(() => {});

  // Queue invitation email
  addEmailJob({
    type: 'workspace-invite',
    to: targetUser.email,
    subject: `${actor?.name ?? 'Someone'} invited you to "${workspace.name}"`,
    html: `<p>Hi ${targetUser.name},</p><p>You have been added to <strong>${workspace.name}</strong> as <em>${member.role}</em>.</p>`,
  }).catch(() => {});

  auditLogRepo.create({
    userId: actorId,
    workspaceId,
    action: 'invite',
    entityType: 'WorkspaceMember',
    entityId: member._id,
    metadata: { invitedUserId: targetUser._id, role: member.role },
  }).catch(() => {});

  return member;
}

/**
 * List workspace members
 */
async function getMembers(workspaceId, { page, limit }) {
  const { members, total } = await workspaceMemberRepo.findByWorkspaceId(workspaceId, { page, limit });
  return { members, pagination: buildPaginationMeta(total, page, limit) };
}

/**
 * Update a member's role. Only owner can promote/demote.
 */
async function updateMemberRole({ workspaceId, memberId, role }, actorId, actorRole) {
  const member = await workspaceMemberRepo.findById(memberId);
  if (!member || member.workspaceId.toString() !== workspaceId) {
    throw ApiError.notFound('Member not found');
  }

  // Cannot change the owner's role
  if (member.role === 'owner') {
    throw ApiError.forbidden('Cannot change the role of the workspace owner');
  }

  // Only owner can assign admin role
  if (role === 'owner') {
    throw ApiError.forbidden('Cannot assign owner role via this endpoint');
  }

  if (actorRole !== 'owner' && role === 'admin') {
    throw ApiError.forbidden('Only the owner can assign the admin role');
  }

  const updated = await workspaceMemberRepo.updateRole(memberId, role);

  auditLogRepo.create({
    userId: actorId,
    workspaceId,
    action: 'update',
    entityType: 'WorkspaceMember',
    entityId: memberId,
    metadata: { previousRole: member.role, newRole: role },
  }).catch(() => {});

  return updated;
}

/**
 * Remove a member from a workspace
 */
async function removeMember({ workspaceId, memberId }, actorId, actorRole) {
  const member = await workspaceMemberRepo.findById(memberId);
  if (!member || member.workspaceId.toString() !== workspaceId) {
    throw ApiError.notFound('Member not found');
  }

  if (member.role === 'owner') {
    throw ApiError.forbidden('Cannot remove the workspace owner');
  }

  // Members can remove themselves; admins/owners can remove others
  const isSelf = member.userId.toString() === actorId.toString();
  if (!isSelf && actorRole !== 'owner' && actorRole !== 'admin') {
    throw ApiError.forbidden('Insufficient permissions to remove this member');
  }

  await workspaceMemberRepo.deleteById(memberId);

  auditLogRepo.create({
    userId: actorId,
    workspaceId,
    action: 'delete',
    entityType: 'WorkspaceMember',
    entityId: memberId,
    metadata: { removedUserId: member.userId },
  }).catch(() => {});
}

module.exports = { addMember, getMembers, updateMemberRole, removeMember };
