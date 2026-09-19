'use strict';

const mongoose = require('mongoose');

const WORKSPACE_STATUSES = ['active', 'archived'];

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
    },
    status: {
      type: String,
      enum: {
        values: WORKSPACE_STATUSES,
        message: `Status must be one of: ${WORKSPACE_STATUSES.join(', ')}`,
      },
      default: 'active',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
workspaceSchema.index({ slug: 1 }, { unique: true });
workspaceSchema.index({ ownerId: 1 });
workspaceSchema.index({ status: 1 });
workspaceSchema.index({ deletedAt: 1 });
workspaceSchema.index({ createdAt: -1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = { Workspace, WORKSPACE_STATUSES };
