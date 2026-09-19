'use strict';

const mongoose = require('mongoose');

const WORKSPACE_MEMBER_ROLES = ['owner', 'admin', 'member', 'guest'];

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    role: {
      type: String,
      enum: {
        values: WORKSPACE_MEMBER_ROLES,
        message: `Role must be one of: ${WORKSPACE_MEMBER_ROLES.join(', ')}`,
      },
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique compound index: one membership record per user per workspace
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
workspaceMemberSchema.index({ userId: 1 });
workspaceMemberSchema.index({ workspaceId: 1 });
workspaceMemberSchema.index({ role: 1 });

const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);

module.exports = { WorkspaceMember, WORKSPACE_MEMBER_ROLES };
