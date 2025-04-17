import express from 'express';
import * as profileController from '../../controllers/user/profile.controller.js';
import { authenticateJWT, requireUser } from '../../middlewares/auth.js';
import { upload } from '../../utils/uploadHandler.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /user/profile:
 *   get:
 *     tags:
 *       - User Profile
 *     summary: Get user profile
 *     description: Retrieve current user's profile information
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 name:
 *                   type: string
 *                   example: string
 *                 role:
 *                   type: string
 *                   example: user
 *                 avatar_url:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 phone_number:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 address:
 *                   type: string
 *                   nullable: true
 *                   example: null
 *                 status:
 *                   type: string
 *                   example: active
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireUser,
  requestLogger,
  profileController.getUserProfile
);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     tags:
 *       - User Profile
 *     summary: Update user profile
 *     description: Update current user's profile information, including optional avatar upload
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
 *                 example: John Doe
 *               phone_number:
 *                 type: string
 *                 example: 0123456789
 *               address:
 *                 type: string
 *                 example: 123 Main St, City, Country
 *               avatar:
 *                 type: string
 *                 format: binary
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
 *                   example: User profile updated successfully.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     role:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     address:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid input data or avatar upload failed
 *       401:
 *         description: Unauthorized - not logged in
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  '/',
  authenticateJWT,
  requireUser,
  requestLogger,
  upload.single('avatar'),
  profileController.updateUserProfile
);

// /**
//  * @swagger
//  * /user/profile/bookmarks:
//  *   get:
//  *     tags:
//  *       - User Profile
//  *     summary: Get user bookmarks
//  *     description: Retrieve current user's bookmarked tours
//  *     security:
//  *       - BearerAuth: []
//  *     responses:
//  *       200:
//  *         description: User bookmarks
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: array
//  *               items:
//  *                 type: object
//  *                 properties:
//  *                   tour_id:
//  *                     type: string
//  *                   title:
//  *                     type: string
//  *                   image:
//  *                     type: string
//  *                   price:
//  *                     type: number
//  *                   rating:
//  *                     type: number
//  *                   location:
//  *                     type: string
//  *       401:
//  *         description: Unauthorized - not logged in
//  *       500:
//  *         description: Server error
//  */
// router.get('/bookmarks', authenticateJWT, profileController.getUserBookmarks);

// /**
//  * @swagger
//  * /user/profile/bookmarks/{tourId}:
//  *   post:
//  *     tags:
//  *       - User Profile
//  *     summary: Add bookmark
//  *     description: Add a tour to user's bookmarks
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: tourId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Tour ID to bookmark
//  *     responses:
//  *       200:
//  *         description: Tour bookmarked successfully
//  *       401:
//  *         description: Unauthorized - not logged in
//  *       404:
//  *         description: Tour not found
//  *       500:
//  *         description: Server error
//  */
// router.post(
//   '/bookmarks/:tourId',
//   authenticateJWT,
//   profileController.addBookmark
// );

// /**
//  * @swagger
//  * /user/profile/bookmarks/{tourId}:
//  *   delete:
//  *     tags:
//  *       - User Profile
//  *     summary: Remove bookmark
//  *     description: Remove a tour from user's bookmarks
//  *     security:
//  *       - BearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: tourId
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: Tour ID to remove from bookmarks
//  *     responses:
//  *       200:
//  *         description: Bookmark removed successfully
//  *       401:
//  *         description: Unauthorized - not logged in
//  *       404:
//  *         description: Bookmark not found
//  *       500:
//  *         description: Server error
//  */
// router.delete(
//   '/bookmarks/:tourId',
//   authenticateJWT,
//   profileController.removeBookmark
// );

export default router;
