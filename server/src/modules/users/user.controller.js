'use strict';

const userService = require('../../services/user.service');
const ApiResponse = require('../../utils/ApiResponse');

/**
 * GET /api/v1/users/me
 */
async function getProfile(req, res, next) {
  try {
    const user = await userService.getProfile(req.user._id);
    return res.status(200).json(ApiResponse.success(user, 'Profile retrieved'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/users/me
 */
async function updateProfile(req, res, next) {
  try {
    const user = await userService.updateProfile(req.user._id, req.body);
    return res.status(200).json(ApiResponse.success(user, 'Profile updated'));
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/v1/users/me/password
 */
async function changePassword(req, res, next) {
  try {
    await userService.changePassword(req.user._id, req.body);
    return res.status(200).json(ApiResponse.success(null, 'Password changed successfully'));
  } catch (err) {
    return next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
