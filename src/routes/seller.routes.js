import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { sellerMiddleware } from '../middlewares/seller.middleware.js';
import {
  getSellerProfile,
  updateSellerProfile,
  deleteSeller,
} from '../controllers/seller/profile.controller.js';
import {
  registerSeller,
  loginSeller,
  verifySellerEmail,
  forgotSellerPassword,
  resetSellerPassword,
} from '../controllers/seller/auth.controller.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /api/sellers/register:
 *   post:
 *     summary: Register a new seller
 *     description: Creates a new seller account with the provided information and sends a verification email. Sellers start with 'pending' status until email verification.
 *     tags: [Seller Authentication]
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
 *                 description: Seller's email address (must be unique)
 *                 example: seller@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Seller's password (minimum 8 characters)
 *                 example: string
 *               name:
 *                 type: string
 *                 description: Seller's full name or business name
 *                 example: ABC Store
 *               phone_number:
 *                 type: string
 *                 description: Seller's contact number
 *                 example: 0123456789
 *               address:
 *                 type: string
 *                 description: Seller's business address
 *                 example: 123 Commerce St, City, Country
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
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', registerSeller);

/**
 * @swagger
 * /api/sellers/login:
 *   post:
 *     summary: Authenticate a seller
 *     description: Authenticates a seller with email and password, returning a JWT token for authorized API access. The email must be verified and the account must have seller role.
 *     tags: [Seller Authentication]
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
 *                 description: Seller's email address
 *                 example: seller@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Seller's password
 *                 example: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Token'
 *       401:
 *         description: Invalid credentials, email not verified, or not a seller account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginSeller);

/**
 * @swagger
 * /api/sellers/verify-email/{token}:
 *   get:
 *     summary: Verify seller email
 *     description: Verifies a seller's email address using the verification token sent via email. Changes the account status from 'pending' to 'active'.
 *     tags: [Seller Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token sent to seller's email
 *         example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Seller email verified successfully
 *       400:
 *         description: Invalid verification token or token not for a seller account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify-email/:token', verifySellerEmail);

/**
 * @swagger
 * /api/sellers/forgot-password:
 *   post:
 *     summary: Request password reset for seller account
 *     description: Sends a password reset email with a reset token link if the email exists in the system and belongs to a seller.
 *     tags: [Seller Authentication]
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
 *                 description: Seller's registered email address
 *                 example: seller@gmail.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       400:
 *         description: Email is not registered as a seller
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/forgot-password', forgotSellerPassword);

/**
 * @swagger
 * /api/sellers/reset-password/{token}:
 *   post:
 *     summary: Reset seller password using token
 *     description: Resets a seller's password using the token received via email. Validates that the token belongs to a seller account.
 *     tags: [Seller Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token sent to seller's email
 *         example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
 *                 description: New password (minimum 8 characters)
 *                 example: Newstring
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Seller password reset successful
 *       400:
 *         description: Invalid reset token or token not for a seller account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/reset-password/:token', resetSellerPassword);

/**
 * @swagger
 * components:
 *   schemas:
 *     SellerProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: 60d21b4667d0d8992e610c85
 *         email:
 *           type: string
 *           example: seller@gmail.com
 *         name:
 *           type: string
 *           example: ABC Store
 *         avatar_url:
 *           type: string
 *           example: https://storage.example.com/seller-avatars/abc-store.jpg
 *         phone_number:
 *           type: string
 *           example: 0123456789
 *         address:
 *           type: string
 *           example: 123 Commerce St, City, Country
 *         role:
 *           type: string
 *           example: seller
 *         status:
 *           type: string
 *           example: active
 *         is_email_verified:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/sellers/profile:
 *   get:
 *     summary: Get seller profile
 *     description: Retrieves the authenticated seller's profile information.
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerProfile'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not a seller account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', authMiddleware, sellerMiddleware, getSellerProfile);

/**
 * @swagger
 * /api/sellers/profile:
 *   put:
 *     summary: Update seller profile
 *     description: Updates the authenticated seller's profile information and/or avatar.
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Seller's full name or business name
 *                 example: ABC Store Updated
 *               phone_number:
 *                 type: string
 *                 description: Seller's contact number
 *                 example: 0123456789
 *               address:
 *                 type: string
 *                 description: Seller's business address
 *                 example: 123 Commerce St, City, Country
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Seller's profile picture or logo (JPG, PNG)
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerProfile'
 *       400:
 *         description: Invalid input or file format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not a seller account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/profile',
  authMiddleware,
  sellerMiddleware,
  upload.single('avatar'),
  updateSellerProfile
);

/**
 * @swagger
 * /api/sellers/profile:
 *   delete:
 *     summary: Delete seller account
 *     description: Permanently deletes the authenticated seller's account and all associated data.
 *     tags: [Seller Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Seller account deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not a seller account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Seller not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/profile', authMiddleware, sellerMiddleware, deleteSeller);

export default router;
