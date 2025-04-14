import express from 'express';
import * as authController from '../../controllers/seller/auth.controller.js';
import { authenticateJWT, requireSeller } from '../../middlewares/auth.js';

const router = express.Router();

/**
 * @swagger
 * /seller/auth/register:
 *   post:
 *     tags:
 *       - Seller Authentication
 *     summary: Register a new seller
 *     description: Create a new seller account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Seller successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Seller registered. Please verify your email.
 *       400:
 *         description: Invalid input or email already in use
 *       500:
 *         description: Server error
 */
router.post('/register', authController.registerSeller);

/**
 * @swagger
 * /seller/auth/login:
 *   post:
 *     tags:
 *       - Seller Authentication
 *     summary: Login as seller
 *     description: Authenticate seller and return JWT token
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
 *         description: Login successful
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
 *                 seller:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     avatar_url:
 *                       type: string
 *                       nullable: true
 *       401:
 *         description: Invalid credentials, email not verified, or not a seller account
 *       500:
 *         description: Server error
 */
router.post('/login', authController.loginSeller);

/**
 * @swagger
 * /seller/auth/reset-password:
 *   post:
 *     tags:
 *       - Seller Authentication
 *     summary: Request password reset
 *     description: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: Seller not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', authController.forgotSellerPassword);

/**
 * @swagger
 * /seller/auth/reset-password/{token}:
 *   post:
 *     tags:
 *       - Seller Authentication
 *     summary: Complete password reset
 *     description: Reset password using reset token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
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
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password successfully reset
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/reset-password/:token', authController.resetSellerPassword);

/**
 * @swagger
 * /seller/auth/change-password:
 *   put:
 *     tags:
 *       - Seller Authentication
 *     summary: Change password
 *     description: Change seller's password (requires authentication)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 *       403:
 *         description: Unauthorized - not logged in
 *       500:
 *         description: Server error
 */
router.put(
  '/change-password',
  authenticateJWT,
  requireSeller,
  authController.changeSellerPassword
);

/**
 * @swagger
 * /seller/auth/verify-email/{token}:
 *   get:
 *     tags:
 *       - Seller Authentication
 *     summary: Verify email
 *     description: Verify seller's email using verification token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.get('/verify-email/:token', authController.verifySellerEmail);

/**
 * @swagger
 * /seller/auth/refresh-token:
 *   post:
 *     tags:
 *       - Seller Authentication
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
 *                 seller:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     avatar_url:
 *                       type: string
 *       400:
 *         description: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh-token', authController.refreshSellerToken);

export default router;
