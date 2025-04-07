import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';
import {
  loginAdmin,
  changeAdminPassword,
} from '../controllers/admin/auth.controller.js';
import {
  getAllUsers,
  deleteUser,
} from '../controllers/admin/user.controller.js';
import {
  getAllSellers,
  deleteSellerById,
} from '../controllers/admin/seller.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserList:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           id:
 *             type: string
 *             example: 60d21b4667d0d8992e610c85
 *           email:
 *             type: string
 *             example: john@gmail.com
 *           name:
 *             type: string
 *             example: John Doe
 *           role:
 *             type: string
 *             example: user
 *           status:
 *             type: string
 *             example: active
 *           avatar_url:
 *             type: string
 *             example: https://storage.example.com/avatars/john.jpg
 *           phone_number:
 *             type: string
 *             example: 0123456789
 *           address:
 *             type: string
 *             example: 123 Main St, City, Country
 *           is_email_verified:
 *             type: boolean
 *             example: true
 *     SellerList:
 *       type: array
 *       items:
 *         type: object
 *         properties:
 *           id:
 *             type: string
 *             example: 60d21b4667d0d8992e610c86
 *           email:
 *             type: string
 *             example: seller@gmail.com
 *           name:
 *             type: string
 *             example: ABC Store
 *           avatar_url:
 *             type: string
 *             example: https://storage.example.com/avatars/abc-store.jpg
 *           phone_number:
 *             type: string
 *             example: 0123456789
 *           address:
 *             type: string
 *             example: 123 Commerce St, City, Country
 *           status:
 *             type: string
 *             example: active
 *           is_email_verified:
 *             type: boolean
 *             example: true
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Authenticate an admin
 *     description: Authenticates an admin with email and password, returning a JWT token for authorized API access.
 *     tags: [Admin - Authentication]
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
 *                 description: Admin's email address
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Admin's password
 *                 example: adminpassword
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Token'
 *       401:
 *         description: Invalid credentials or not an admin account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginAdmin);

/**
 * @swagger
 * /api/admin/change-password:
 *   put:
 *     summary: Change admin password
 *     description: Allows an admin to change their password. Requires authentication.
 *     tags: [Admin - Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                 description: New admin password (minimum 8 characters)
 *                 example: newadminpassword
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
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not an admin account
 *       404:
 *         description: Admin not found
 */
router.put(
  '/change-password',
  authMiddleware,
  adminMiddleware,
  changeAdminPassword
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users in the system. Only accessible to administrators.
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied, admin privileges required
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
router.get('/users', authMiddleware, adminMiddleware, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Permanently deletes a user account by ID. Administrators cannot delete themselves.
 *     tags: [Admin - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *         example: 60d21b4667d0d8992e610c85
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Bad request - Admins cannot delete themselves
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
 *         description: Forbidden - Access denied, admin privileges required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
router.delete('/users/:id', authMiddleware, adminMiddleware, deleteUser);

/**
 * @swagger
 * /api/admin/sellers:
 *   get:
 *     summary: Get all sellers
 *     description: Retrieves a list of all sellers in the system. Only accessible to administrators.
 *     tags: [Admin - Seller Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sellers successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SellerList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Access denied, admin privileges required
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
router.get('/sellers', authMiddleware, adminMiddleware, getAllSellers);

/**
 * @swagger
 * /api/admin/sellers/{id}:
 *   delete:
 *     summary: Delete a seller
 *     description: Permanently deletes a seller account by ID. Verifies that the account has seller role before deletion.
 *     tags: [Admin - Seller Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID to delete
 *         example: 60d21b4667d0d8992e610c86
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
 *                   example: Seller deleted successfully
 *       400:
 *         description: Bad request - User is not a seller
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
 *         description: Forbidden - Access denied, admin privileges required
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
router.delete(
  '/sellers/:id',
  authMiddleware,
  adminMiddleware,
  deleteSellerById
);

export default router;
