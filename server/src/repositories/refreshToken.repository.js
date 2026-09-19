'use strict';

const { RefreshToken } = require('../models');

/**
 * Create a new refresh token record
 * @param {object} data
 */
async function create(data) {
  return RefreshToken.create(data);
}

/**
 * Find an active (non-revoked, non-expired) refresh token by hash
 * @param {string} tokenHash
 */
async function findActiveByHash(tokenHash) {
  return RefreshToken.findOne({
    tokenHash,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
}

/**
 * Revoke a refresh token by its ID
 * @param {string} tokenId
 * @param {string} [replacedByTokenId]
 */
async function revokeById(tokenId, replacedByTokenId = null) {
  const update = { revokedAt: new Date() };
  if (replacedByTokenId) {
    update.replacedByTokenId = replacedByTokenId;
  }
  return RefreshToken.findByIdAndUpdate(tokenId, update, { new: true });
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 * @param {string} userId
 */
async function revokeAllForUser(userId) {
  return RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}

/**
 * Delete expired refresh tokens (cleanup job)
 */
async function deleteExpired() {
  return RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
}

module.exports = {
  create,
  findActiveByHash,
  revokeById,
  revokeAllForUser,
  deleteExpired,
};
