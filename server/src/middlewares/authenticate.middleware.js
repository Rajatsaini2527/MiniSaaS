'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware.
 * Verifies JWT access token from Authorization: Bearer <token> header.
 * Attaches req.user = { _id, name, email, status, ... } (without password).
 */
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(ApiError.unauthorized('Access token required'));
    }

    const token = authHeader.slice(7);

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Access token expired'));
      }
      return next(ApiError.unauthorized('Invalid access token'));
    }

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return next(ApiError.unauthorized('User not found'));
    }

    if (user.deletedAt) {
      return next(ApiError.unauthorized('Account has been deleted'));
    }

    if (user.status === 'suspended') {
      return next(ApiError.forbidden('Account is suspended'));
    }

    if (user.status === 'inactive') {
      return next(ApiError.forbidden('Account is inactive'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authenticate;
