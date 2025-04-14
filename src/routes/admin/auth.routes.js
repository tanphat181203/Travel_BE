import express from 'express';
import {
  loginAdmin,
  changeAdminPassword,
  refreshAdminToken,
} from '../../controllers/admin/auth.controller.js';
import { authenticateJWT, requireAdmin } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /admin/auth/login:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Login as admin
 *     description: Authenticate admin user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT access token for authentication (short-lived)
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token for obtaining new access tokens (long-lived)
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *       401:
 *         description: Invalid credentials or not an admin account
 *       500:
 *         description: Server error
 */
router.post('/login', loginAdmin);

/**
 * @swagger
 * /admin/auth/change-password:
 *   put:
 *     tags:
 *       - Admin Authentication
 *     summary: Change admin password
 *     description: Change password for authenticated admin
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin password changed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       404:
 *         description: Admin account not found
 *       500:
 *         description: Server error
 */
router.put(
  '/change-password',
  authenticateJWT,
  requireAdmin,
  changeAdminPassword
);

/**
 * @swagger
 * /admin/auth/refresh-token:
 *   post:
 *     tags:
 *       - Admin Authentication
 *     summary: Refresh access token
 *     description: Get a new access token using a refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *       400:
 *         description: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh-token', refreshAdminToken);

export default router;
