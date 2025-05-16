import express from 'express';
import { getProfile, updateProfile } from '../../controllers/admin/profile.controller.js';
import { authenticateJWT, requireAdmin } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';
import { upload } from '../../utils/uploadHandler.js';

const router = express.Router();

/**
 * @swagger
 * /admin/profile:
 *   get:
 *     tags:
 *       - Admin Profile
 *     summary: Get admin profile
 *     description: Retrieve the profile information of the currently authenticated admin
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                   format: email
 *                 name:
 *                   type: string
 *                 avatar_url:
 *                   type: string
 *                   nullable: true
 *                 phone_number:
 *                   type: string
 *                   nullable: true
 *                 address:
 *                   type: string
 *                   nullable: true
 *                 status:
 *                   type: string
 *                 role:
 *                   type: string
 *                   example: admin
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied, admin privileges required
 *       404:
 *         description: Admin account not found
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireAdmin,
  requestLogger,
  getProfile
);

/**
 * @swagger
 * /admin/profile:
 *   put:
 *     tags:
 *       - Admin Profile
 *     summary: Update admin profile
 *     description: Update the profile information of the currently authenticated admin. Email cannot be changed.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                       format: email
 *                     name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *                     phone_number:
 *                       type: string
 *                       nullable: true
 *                     address:
 *                       type: string
 *                       nullable: true
 *                     status:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Error with file upload or invalid data
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
  '/',
  authenticateJWT,
  requireAdmin,
  upload.single('avatar'),
  requestLogger,
  updateProfile
);

export default router; 