'use strict';

const { User } = require('../models');

/**
 * Find a user by ID (no password)
 * @param {string} id
 */
async function findById(id) {
  return User.findById(id);
}

/**
 * Find a user by ID, including password field
 * @param {string} id
 */
async function findByIdWithPassword(id) {
  return User.findById(id).select('+password');
}

/**
 * Find a user by email (no password)
 * @param {string} email
 */
async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase(), deletedAt: null });
}

/**
 * Find a user by email including password field
 * @param {string} email
 */
async function findByEmailWithPassword(email) {
  return User.findOne({ email: email.toLowerCase(), deletedAt: null }).select('+password');
}

/**
 * Create a new user
 * @param {object} data
 */
async function create(data) {
  return User.create(data);
}

/**
 * Update a user by ID
 * @param {string} id
 * @param {object} updates
 */
async function updateById(id, updates) {
  return User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
}

/**
 * Soft-delete a user
 * @param {string} id
 */
async function softDelete(id) {
  return User.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true });
}

module.exports = {
  findById,
  findByIdWithPassword,
  findByEmail,
  findByEmailWithPassword,
  create,
  updateById,
  softDelete,
};
