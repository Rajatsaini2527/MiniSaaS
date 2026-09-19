'use strict';

const mongoose = require('mongoose');

const ATTACHMENT_PROVIDERS = ['local', 's3', 'gcs', 'azure'];

const attachmentSchema = new mongoose.Schema(
  {
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'Original name cannot exceed 255 characters'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    storageKey: {
      type: String,
      required: [true, 'Storage key is required'],
      trim: true,
    },
    provider: {
      type: String,
      enum: {
        values: ATTACHMENT_PROVIDERS,
        message: `Provider must be one of: ${ATTACHMENT_PROVIDERS.join(', ')}`,
      },
      default: 'local',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes
attachmentSchema.index({ taskId: 1 });
attachmentSchema.index({ projectId: 1 });
attachmentSchema.index({ uploadedBy: 1 });
attachmentSchema.index({ createdAt: -1 });

const Attachment = mongoose.model('Attachment', attachmentSchema);

module.exports = { Attachment, ATTACHMENT_PROVIDERS };
