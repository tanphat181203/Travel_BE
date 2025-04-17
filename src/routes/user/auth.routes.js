import express from 'express';
import * as authController from '../../controllers/user/auth.controller.js';
import { authenticateJWT } from '../../middlewares/auth.js';
import requestLogger from './../../middlewares/requestLogger.js';

const router = express.Router();

/**
 * @swagger
 * /user/auth/register:
 *   post:
 *     tags:
 *       - User Authentication
 *     summary: Register a new user
 *     description: Create a new user account
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
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered. Please verify your email.
 *       400:
 *         description: Invalid input or email already in use
 *       500:
 *         description: Server error
 */
router.post('/register', requestLogger, authController.registerUser);

/**
 * @swagger
 * /user/auth/login:
 *   post:
 *     tags:
 *       - User Authentication
 *     summary: Login as user
 *     description: Authenticate user and return JWT token
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                       format: email
 *                     name:
 *                       type: string
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', requestLogger, authController.loginUser);

/**
 * @swagger
 * /user/auth/google:
 *   get:
 *     tags:
 *       - User Authentication
 *     summary: Login with Google
 *     description: Redirect to Google authentication
 *     responses:
 *       302:
 *         description: Redirects to Google authentication page
 */
router.get('/google', requestLogger, authController.googleLogin);

/**
 * @swagger
 * /user/auth/google/callback:
 *   get:
 *     tags:
 *       - User Authentication
 *     summary: Google auth callback
 *     description: Callback endpoint for Google OAuth authentication
 *     responses:
 *       200:
 *         description: Authentication successful, returns JWT token and user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
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
 *         description: Google login failed
 */
router.get('/google/callback', requestLogger, authController.googleCallback);

/**
 * @swagger
 * /user/auth/reset-password:
 *   post:
 *     tags:
 *       - User Authentication
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
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', requestLogger, authController.forgotPassword);

/**
 * @swagger
 * /user/auth/reset-password/{token}:
 *   post:
 *     tags:
 *       - User Authentication
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
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password successfully reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post(
  '/reset-password/:token',
  requestLogger,
  authController.resetPassword
);

/**
 * @swagger
 * /user/auth/change-password:
 *   put:
 *     tags:
 *       - User Authentication
 *     summary: Change password
 *     description: Change user's password (requires authentication)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
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
 *                   example: Password changed successfully
 *       401:
 *         description: Old password is incorrect
 *       403:
 *         description: Unauthorized - not logged in
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put(
  '/change-password',
  requestLogger,
  authenticateJWT,
  authController.changePassword
);

/**
 * @swagger
 * /user/auth/verify-email/{token}:
 *   get:
 *     tags:
 *       - User Authentication
 *     summary: Verify email
 *     description: Verify user's email using verification token
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
router.get('/verify-email/:token', requestLogger, authController.verifyEmail);

/**
 * @swagger
 * /user/auth/refresh-token:
 *   post:
 *     tags:
 *       - User Authentication
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
 *                 user:
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
router.post('/refresh-token', requestLogger, authController.refreshToken);

export default router;
