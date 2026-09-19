'use strict';

const userRepo = require('../repositories/user.repository');
const { hashPassword, comparePassword } = require('../utils/hash');
const ApiError = require('../utils/ApiError');

/**
 * Get current user profile
 */
async function getProfile(userId) {
  const user = await userRepo.findById(userId);
  if (!user || user.deletedAt) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

/**
 * Update user profile (name, avatar)
 */
async function updateProfile(userId, { name, avatar }) {
  const updates = {};
  if (name !== undefined) { updates.name = name; }
  if (avatar !== undefined) { updates.avatar = avatar; }

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No fields provided to update');
  }

  const user = await userRepo.updateById(userId, updates);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

/**
 * Change password
 */
async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await userRepo.findByIdWithPassword(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isMatch = await comparePassword(currentPassword, user.password);
  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  if (currentPassword === newPassword) {
    throw ApiError.badRequest('New password must be different from current password');
  }

  const hashedPassword = await hashPassword(newPassword);
  await userRepo.updateById(userId, { password: hashedPassword });
}

module.exports = { getProfile, updateProfile, changePassword };
