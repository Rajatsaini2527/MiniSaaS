'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Allowed MIME types
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv',
  'application/zip',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.txt', '.csv', '.zip',
]);

// Ensure upload directory exists
const uploadDir = path.resolve(env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const avatarDir = path.join(uploadDir, 'avatars');
if (!fs.existsSync(avatarDir)) { fs.mkdirSync(avatarDir, { recursive: true }); }
const attachmentDir = path.join(uploadDir, 'attachments');
if (!fs.existsSync(attachmentDir)) { fs.mkdirSync(attachmentDir, { recursive: true }); }

function safeStorageName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const random = crypto.randomBytes(16).toString('hex');
  return `${Date.now()}-${random}${ext}`;
}

function createStorage(subdir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, path.join(uploadDir, subdir));
    },
    filename: (_req, file, cb) => {
      cb(null, safeStorageName(file.originalname));
    },
  });
}

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  // Check both extension and declared MIME type (don't trust MIME alone)
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(ApiError.badRequest(`File extension "${ext}" not allowed`));
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(ApiError.badRequest(`MIME type "${file.mimetype}" not allowed`));
  }
  cb(null, true);
}

/**
 * Avatar upload — single image, max 2MB
 */
const avatarUpload = multer({
  storage: createStorage('avatars'),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

/**
 * Attachment upload — single file, max env.MAX_FILE_SIZE
 */
const attachmentUpload = multer({
  storage: createStorage('attachments'),
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE, files: 1 },
});

/**
 * Multer error handler middleware
 */
function handleMulterError(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large' });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  return next(err);
}

module.exports = { avatarUpload, attachmentUpload, handleMulterError, uploadDir };
