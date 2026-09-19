'use strict';

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      minlength: [1, 'Content must be at least 1 character'],
      maxlength: [5000, 'Content cannot exceed 5000 characters'],
    },
    editedAt: {
      type: Date,
      default: null,
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

// Index for fetching comments for a task ordered by creation time
commentSchema.index({ taskId: 1, createdAt: 1 });
commentSchema.index({ userId: 1 });
commentSchema.index({ deletedAt: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = { Comment };
