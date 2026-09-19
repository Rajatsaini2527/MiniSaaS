'use strict';

const userRepo = require('../repositories/user.repository');
const refreshTokenRepo = require('../repositories/refreshToken.repository');
const auditLogRepo = require('../repositories/auditLog.repository');
const { hashPassword, comparePassword, hashToken } = require('../utils/hash');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * Parse JWT expiry string to milliseconds
 * @param {string} expiry - e.g. '7d', '15m'
 */
function parseExpiryToMs(expiry) {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const map = { s: 1000, m: 60 * 1000, h: 3600 * 1000, d: 86400 * 1000 };
  return value * (map[unit] || 86400 * 1000);
}

/**
 * Register a new user
 */
async function register({ name, email, password }) {
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    throw ApiError.conflict('Email is already registered');
  }

  const hashedPassword = await hashPassword(password);
  const user = await userRepo.create({ name, email, password: hashedPassword });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}

/**
 * Login a user — returns access + refresh tokens
 */
async function login({ email, password, userAgent, ipAddress }) {
  const user = await userRepo.findByEmailWithPassword(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (user.status === 'suspended') {
    throw ApiError.forbidden('Account is suspended');
  }
  if (user.status === 'inactive') {
    throw ApiError.forbidden('Account is inactive');
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Generate tokens
  const accessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
  // Sign the refresh JWT first, then hash it for storage (so cookie value == lookup key)
  const refreshToken = signRefreshToken({ userId: user._id.toString() });
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN));

  await refreshTokenRepo.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    userAgent: userAgent || null,
    ipAddress: ipAddress || null,
  });

  // Update lastLoginAt
  await userRepo.updateById(user._id, { lastLoginAt: new Date() });

  // Audit log
  await auditLogRepo.create({
    userId: user._id,
    action: 'login',
    entityType: 'User',
    entityId: user._id,
    metadata: { email: user.email },
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
    },
  };
}

/**
 * Refresh access token using a valid refresh token
 */
async function refreshTokens({ refreshToken, userAgent, ipAddress }) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await refreshTokenRepo.findActiveByHash(tokenHash);
  if (!storedToken) {
    throw ApiError.unauthorized('Refresh token has been revoked or expired');
  }

  // Validate userId matches
  if (storedToken.userId.toString() !== decoded.userId) {
    throw ApiError.unauthorized('Token mismatch');
  }

  const user = await userRepo.findById(decoded.userId);
  if (!user || user.deletedAt) {
    throw ApiError.unauthorized('User not found');
  }
  if (user.status !== 'active') {
    throw ApiError.forbidden('Account is not active');
  }

  // Rotate: revoke old, issue new — sign JWT first, then hash it for storage
  const newAccessToken = signAccessToken({ userId: user._id.toString(), email: user.email });
  const newRefreshToken = signRefreshToken({ userId: user._id.toString() });
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN));

  const newRefreshTokenDoc = await refreshTokenRepo.create({
    userId: user._id,
    tokenHash: newTokenHash,
    expiresAt,
    userAgent: userAgent || null,
    ipAddress: ipAddress || null,
  });

  await refreshTokenRepo.revokeById(storedToken._id, newRefreshTokenDoc._id);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}

/**
 * Logout — revoke the refresh token
 */
async function logout({ refreshToken, userId, ipAddress, userAgent }) {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const storedToken = await refreshTokenRepo.findActiveByHash(tokenHash);
    if (storedToken && storedToken.userId.toString() === userId.toString()) {
      await refreshTokenRepo.revokeById(storedToken._id);
    }
  }

  await auditLogRepo.create({
    userId,
    action: 'logout',
    entityType: 'User',
    entityId: userId,
    metadata: {},
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
  });
}

/**
 * Get current user profile
 */
async function getMe(userId) {
  const user = await userRepo.findById(userId);
  if (!user || user.deletedAt) {
    throw ApiError.notFound('User not found');
  }
  return user;
}

module.exports = { register, login, refreshTokens, logout, getMe };
