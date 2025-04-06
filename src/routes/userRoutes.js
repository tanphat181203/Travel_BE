import express from 'express';
import {
  getProfile,
  updateProfile,
  deleteUser,
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { upload } from '../utils/uploadHandler.js';

const router = express.Router();

/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the current authenticated user's profile information
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The user ID
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The user's email
 *                 name:
 *                   type: string
 *                   description: The user's name
 *                 role:
 *                   type: string
 *                   enum: [user, admin, seller]
 *                   description: The user's role
 *                 avatar_url:
 *                   type: string
 *                   format: uri
 *                   description: URL to the user's profile picture
 *                 phone_number:
 *                   type: string
 *                   description: The user's phone number
 *                 address:
 *                   type: string
 *                   description: The user's address
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, banned]
 *                   description: The user's account status
 *                 is_email_verified:
 *                   type: boolean
 *                   description: Whether the user's email is verified
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: User not found
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the current authenticated user's profile information with support for avatar upload
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name
 *               phone_number:
 *                 type: string
 *                 description: The user's phone number
 *               address:
 *                 type: string
 *                 description: The user's address
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (max 5MB, images only)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: The user ID
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: The user's email
 *                 name:
 *                   type: string
 *                   description: The user's name
 *                 role:
 *                   type: string
 *                   enum: [user, admin, seller]
 *                   description: The user's role
 *                 avatar_url:
 *                   type: string
 *                   format: uri
 *                   description: URL to the user's profile picture
 *                 phone_number:
 *                   type: string
 *                   description: The user's phone number
 *                 address:
 *                   type: string
 *                   description: The user's address
 *                 status:
 *                   type: string
 *                   enum: [active, inactive, banned]
 *                   description: The user's account status
 *                 is_email_verified:
 *                   type: boolean
 *                   description: Whether the user's email is verified
 *       400:
 *         description: Invalid input data or file upload error
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: User not found
 */
router.put('/profile', authMiddleware, upload.single('avatar'), updateProfile);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Delete user account
 *     description: Delete the current authenticated user's account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: User not found
 */
router.delete('/', authMiddleware, deleteUser);

export default router;
