'use strict';

const authService = require('../../services/auth.service');
const ApiResponse = require('../../utils/ApiResponse');

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/v1/auth',
};

/**
 * POST /api/v1/auth/register
 */
async function register(req, res, next) {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json(ApiResponse.success(user, 'Account created successfully'));
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res, next) {
  try {
    const result = await authService.login({
      ...req.body,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(
      ApiResponse.success(
        { accessToken: result.accessToken, user: result.user },
        'Login successful'
      )
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/refresh-token
 */
async function refreshToken(req, res, next) {
  try {
    // Accept from cookie or body
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json(ApiResponse.error('Refresh token required'));
    }

    const result = await authService.refreshTokens({
      refreshToken: token,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

    return res.status(200).json(
      ApiResponse.success({ accessToken: result.accessToken }, 'Token refreshed')
    );
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 */
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    await authService.logout({
      refreshToken: token,
      userId: req.user._id,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    return res.status(200).json(ApiResponse.success(null, 'Logged out successfully'));
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user._id);
    return res.status(200).json(ApiResponse.success(user, 'User profile retrieved'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, refreshToken, logout, getMe };
