import express from 'express';
import {
  loginAdmin,
  changeAdminPassword,
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
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
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

export default router;
