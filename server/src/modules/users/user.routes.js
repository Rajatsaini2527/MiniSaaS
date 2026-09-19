'use strict';

const { Router } = require('express');
const controller = require('./user.controller');
const authenticate = require('../../middlewares/authenticate.middleware');
const { validate } = require('../../validators/common.validator');
const { updateProfileSchema } = require('../../validators/user.validator');
const { changePasswordSchema } = require('../../validators/auth.validator');

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 */
router.get('/me', controller.getProfile);

/**
 * @swagger
 * /users/me:
 *   put:
 *     tags: [Users]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/me', validate(updateProfileSchema), controller.updateProfile);

/**
 * @swagger
 * /users/me/password:
 *   put:
 *     tags: [Users]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Incorrect current password
 */
router.put('/me/password', validate(changePasswordSchema), controller.changePassword);

module.exports = router;
