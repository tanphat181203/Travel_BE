import express from 'express';
import * as profileController from '../../controllers/seller/profile.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';
import { upload } from '../../utils/uploadHandler.js';

const router = express.Router();

/**
 * @swagger
 * /seller/profile:
 *   get:
 *     tags:
 *       - Seller Profile
 *     summary: Get seller profile
 *     description: Retrieve current seller's profile information
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [seller]
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
 *                   description: Account status (pending_verification, active, suspended)
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  authenticateJWT,
  requireSeller,
  profileController.getSellerProfile
);

/**
 * @swagger
 * /seller/profile:
 *   put:
 *     tags:
 *       - Seller Profile
 *     summary: Update seller profile
 *     description: Update current seller's profile information, including optional avatar upload
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
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [seller]
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
 *                   description: Account status (pending_verification, active, suspended)
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.put(
  '/',
  authenticateJWT,
  requireSeller,
  upload.single('avatar'),
  profileController.updateSellerProfile
);

export default router;
